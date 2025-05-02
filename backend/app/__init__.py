# Standard library imports
import os
import re
from datetime import date

# Third-party imports
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from sqlalchemy import func

# Local application imports
from .finnhub_client import get_profile

# Shared extension objects
db = SQLAlchemy()
migrate = Migrate()


# Helper Function
def size_to_numeric(size_str):
    """
    Converts trade size string (e.g., '1K–15K', '< 1K', '1M–5M')
    to an approximate numeric value (midpoint of range).
    Returns 0 if parsing fails or size is N/A.
    """
    if not size_str or size_str.lower() == 'n/a':
        return 0

    size_str = size_str.replace(',', '').strip()

    def parse_multiplier(value, multiplier):
        """Helper to apply K/M multiplier."""
        if multiplier and multiplier.lower() == 'k':
            return value * 1000
        elif multiplier and multiplier.lower() == 'm':
            return value * 1000000
        return value

    # Handle '<' and '>' cases
    match = re.match(r'([<>])\s*(\d+)([KkMm]?)', size_str)
    if match:
        operator, value, multiplier = match.groups()
        value = parse_multiplier(float(value), multiplier)
        return value / 2 if operator == '<' else value

    # Handle ranges (e.g., '1K–15K', '5M-25M')
    match = re.match(r'(\d+(?:[.,]\d+)?)\s?([KkMm]?)\s?[-–]\s?(\d+(?:[.,]\d+)?)\s?([KkMm]?)', size_str)
    if match:
        val1, mult1, val2, mult2 = match.groups()
        val1 = parse_multiplier(float(val1), mult1)
        val2 = parse_multiplier(float(val2), mult2)
        return (val1 + val2) / 2  # Return midpoint of the range

    # Handle single values (e.g., '100K')
    match = re.match(r'^(\d+(?:[.,]\d+)?)\s?([KkMm]?)$', size_str)
    if match:
        value, multiplier = match.groups()
        return parse_multiplier(float(value), multiplier)

    # If parsing fails, log a warning and return 0
    print(f"Could not parse size string: {size_str}")
    return 0

# Application Factory
def create_app():
    """Application Factory Function"""
    app = Flask(__name__)
    CORS(app)

    # Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Import models
    from . import models  # noqa: F401

    # Routes
    @app.route('/')
    def home():
        return "Hello from SmartTick Backend!"

    @app.route('/api/profile/<symbol>', methods=["GET"])
    def stock_profile(symbol):
        """
        Fetches stock profile information using the Finnhub client.
        """
        if not symbol:
            return jsonify({"error": "Stock symbol is required"}), 400

        try:
            profile_data = get_profile(symbol.upper())
            if not profile_data or not profile_data.get('name'):
                return jsonify({"error": f"No profile data found for symbol {symbol}"}), 404
            return jsonify(profile_data)
        except Exception as e:
            app.logger.error(f"Failed to fetch profile for {symbol}: {e}", exc_info=True)
            return jsonify({"error": "An internal server error occurred"}), 500

    @app.route('/api/trades/summary/<symbol>', methods=["GET"])
    def trade_summary(symbol):
        """
        Provides aggregated monthly buy/sell data for a given stock symbol.
        """
        if not symbol:
            return jsonify({"error": "Stock symbol is required"}), 400

        base_symbol = symbol.upper()
        try:
            # Fetch trade data from the database
            results = fetch_trade_data(base_symbol)

            # Process the results into a monthly summary
            monthly_summary = process_trade_data(results)

            # Format the summary for the response
            summary_list = format_monthly_summary(monthly_summary)

            return jsonify(summary_list)
        except Exception as e:
            app.logger.error(f"Failed to fetch trade summary for {symbol}: {e}", exc_info=True)
            return jsonify({"error": "An internal server error occurred"}), 500


    def fetch_trade_data(base_symbol):
        """
        Fetches trade data for the given stock symbol from the database.
        """
        return db.session.query(
            models.Trade.traded,
            models.Trade.type,
            models.Trade.size
        ).filter(
            models.Trade.traded_issuer_ticker.ilike(f"%{base_symbol}%"),  # Match the symbol
            models.Trade.traded.isnot(None)
        ).order_by(models.Trade.traded).all()


    def process_trade_data(results):
        """
        Processes trade data into a monthly summary.
        """
        monthly_summary = {}

        for trade_date, trade_type, trade_size_str in results:
            if not isinstance(trade_date, date):
                app.logger.warning(f"Skipping record with invalid date: {trade_date}")
                continue

            year, month = trade_date.year, trade_date.month
            month_key = (year, month)
            numeric_size = size_to_numeric(trade_size_str)

            if month_key not in monthly_summary:
                monthly_summary[month_key] = {'buy': 0, 'sell': 0}

            if trade_type.lower() == 'buy':
                monthly_summary[month_key]['buy'] += numeric_size
            elif trade_type.lower() == 'sell':
                monthly_summary[month_key]['sell'] += numeric_size

        return monthly_summary


    def format_monthly_summary(monthly_summary):
        """
        Formats the monthly summary into a list of dictionaries for the API response.
        """
        return [
            {
                "year": key[0],
                "month": key[1],
                "month_label": f"{key[0]}-{key[1]:02d}",
                "buy_total": data['buy'],
                "sell_total": data['sell']
            }
            for key, data in sorted(monthly_summary.items())
        ]

    return app
