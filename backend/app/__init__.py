# SmartTick/backend/app/__init__.py
import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from sqlalchemy import func, extract, case, cast, Integer
import re
# Import date type for checking
from datetime import date # <-- Import date

# --- Initialize extensions outside the factory ---
db = SQLAlchemy()
migrate = Migrate()

# --- Helper function to convert size string to numeric midpoint ---
# (Keep the size_to_numeric function as defined previously)
def size_to_numeric(size_str):
    """
    Converts trade size string (e.g., '1K–15K', '< 1K', '1M–5M')
    to an approximate numeric value (midpoint of range).
    Returns 0 if parsing fails or size is N/A.
    """
    if not size_str or size_str.lower() == 'n/a':
        return 0

    size_str = size_str.replace(',', '').strip() # Clean up string

    # Handle greater/less than cases first
    if size_str.startswith('<'):
        match = re.search(r'< (\d+)([KkMm])?', size_str)
        if match:
            val = int(match.group(1))
            mult = match.group(2)
            if mult and mult.lower() == 'k': val *= 1000
            elif mult and mult.lower() == 'm': val *= 1000000
            return val / 2 # Estimate as half the upper bound
        # Try parsing just '< 1k' etc.
        match_simple = re.search(r'< (\d+)', size_str)
        if match_simple:
             val = int(match_simple.group(1))
             # Assume K if value is small, M if large? Or require K/M?
             # Let's assume K if < 1000, otherwise treat as base unit
             return (val * 1000) / 2 if val < 1000 else val / 2
        return 500 # Default for '< 1K' if specific value not found

    if size_str.startswith('>'):
        match = re.search(r'> (\d+)([KkMm])?', size_str)
        if match:
            val = int(match.group(1))
            mult = match.group(2)
            if mult and mult.lower() == 'k': val *= 1000
            elif mult and mult.lower() == 'm': val *= 1000000
            return val # Use the lower bound as estimate
        # Try parsing just '> 50M' etc.
        match_simple = re.search(r'> (\d+)', size_str)
        if match_simple:
             val = int(match_simple.group(1))
             # Assume M if value is large?
             return (val * 1000000) if val > 1000 else val
        return 50000000 # Default for '> 50M'

    # Handle ranges (e.g., '1K–15K', '5M-25M')
    # Use non-capturing group for K/M optionality
    match = re.search(r'(\d+(?:[.,]\d+)?)\s?([KkMm])?\s?[-–]\s?(\d+(?:[.,]\d+)?)\s?([KkMm])?', size_str)
    if match:
        val1_str, mult1, val2_str, mult2 = match.groups()
        val1 = float(val1_str.replace(',', '.')) # Handle potential decimal commas
        val2 = float(val2_str.replace(',', '.'))

        if mult1 and mult1.lower() == 'k': val1 *= 1000
        elif mult1 and mult1.lower() == 'm': val1 *= 1000000
        if mult2 and mult2.lower() == 'k': val2 *= 1000
        elif mult2 and mult2.lower() == 'm': val2 *= 1000000

        # If only one multiplier is given, assume the other is the same or base unit
        if mult1 and not mult2:
             if val2 > val1: # e.g., 500K - 1M -> assume 500K - 1000K
                 val2 *= 1000 if 'k' in mult1.lower() else 1000000
        elif mult2 and not mult1:
             if val1 < val2: # e.g., 1 - 5K -> assume 1K - 5K? This is ambiguous.
                 # Let's assume base unit if multiplier missing on lower bound
                 pass # val1 remains as parsed

        return (val1 + val2) / 2 # Midpoint

    # Handle single values (e.g., '100K')
    match = re.search(r'^(\d+(?:[.,]\d+)?)\s?([KkMm])?$', size_str)
    if match:
        val_str, mult = match.groups()
        val = float(val_str.replace(',', '.'))
        if mult and mult.lower() == 'k': val *= 1000
        elif mult and mult.lower() == 'm': val *= 1000000
        return val

    print(f"Warning: Could not parse size string: {size_str}")
    return 0
# --- End Helper function ---


def create_app(config_class=None):
    """Application Factory Function"""
    app = Flask(__name__)
    CORS(app) # Enable CORS for frontend requests

    # Configuration (ensure DATABASE_URL is set in environment)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///default.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # --- Initialize extensions with the app instance ---
    db.init_app(app)
    migrate.init_app(app, db)

    # --- Import models and register blueprints/routes ---
    # Import models here *after* db is initialized and within the app context
    from . import models # noqa - prevent unused import warning if models only used via db

    @app.route('/')
    def hello():
        return "Hello from SmartTick Backend!"

    # API Endpoint for Trade Summary
    @app.route('/api/trades/summary/<symbol>')
    def trade_summary(symbol):
        """
        Provides aggregated monthly buy/sell data for a given stock symbol.
        """
        if not symbol:
            return jsonify({"error": "Stock symbol is required"}), 400

        # Normalize symbol (e.g., 'AAPL:US' -> 'AAPL')
        base_symbol = symbol.split(':')[0].upper()

        try:
            # Query raw data and process in Python for flexibility with size_to_numeric.
            query = db.session.query(
                models.Trade.traded, # Reference model via models.Trade
                models.Trade.type,
                models.Trade.size
            ).filter(
                # Match ticker, ignoring potential exchange suffixes like ':US'
                func.split_part(models.Trade.traded_issuer_ticker, ':', 1).ilike(base_symbol)
            ).filter(
                models.Trade.traded.isnot(None) # Ensure trade date exists (already filters NULLs)
            ).order_by(models.Trade.traded)

            results = query.all()

            # Process results in Python
            monthly_summary = {} # Use dict: {(year, month): {'buy': total, 'sell': total}}
            skipped_records = 0 # Counter for records skipped due to bad date type

            for trade_date, trade_type, trade_size_str in results:

                # *** Add type check for trade_date ***
                if not isinstance(trade_date, date):
                    app.logger.warning(f"Skipping record: Expected date object but got {type(trade_date)} for symbol {base_symbol}. Value: {trade_date}")
                    skipped_records += 1
                    continue # Skip this record

                # Ensure trade_type is also valid before proceeding
                if not trade_type:
                    app.logger.warning(f"Skipping record: Missing trade type for symbol {base_symbol}, date {trade_date}")
                    skipped_records += 1
                    continue

                # Now safe to access .year and .month
                year = trade_date.year
                month = trade_date.month
                month_key = (year, month)

                numeric_size = size_to_numeric(trade_size_str)

                if month_key not in monthly_summary:
                    monthly_summary[month_key] = {'buy': 0, 'sell': 0}

                if trade_type.lower() == 'buy':
                    monthly_summary[month_key]['buy'] += numeric_size
                elif trade_type.lower() == 'sell':
                    monthly_summary[month_key]['sell'] += numeric_size

            if skipped_records > 0:
                app.logger.warning(f"Total skipped records due to unexpected date type: {skipped_records} for symbol {base_symbol}")

            # Convert aggregated data to list format for charting
            summary_list = [
                {
                    "year": key[0],
                    "month": key[1],
                    "month_label": f"{key[0]}-{key[1]:02d}", # Format month nicely (e.g., '2024-03')
                    "buy_total": data['buy'],
                    "sell_total": data['sell']
                }
                for key, data in sorted(monthly_summary.items()) # Sort by year, month
            ]

            return jsonify(summary_list)

        except Exception as e:
            # Log the error for debugging
            # Use app.logger for proper logging within Flask
            app.logger.error(f"Error fetching trade summary for {symbol}: {e}", exc_info=True) # exc_info=True logs traceback
            # import traceback # Not needed if using exc_info=True
            # app.logger.error(traceback.format_exc())
            return jsonify({"error": "An internal server error occurred"}), 500

    # --- Return the configured app instance ---
    return app
