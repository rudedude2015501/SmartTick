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

from .finnhub_client import get_profile, get_quote_data, get_financials
from .tiingo_client import get_daily_prices

# local utility items 
from app.utils import extract_key_metrics
from .config import config


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
def create_app(config_name=None):
    """Application Factory Function"""
    app = Flask(__name__)
    CORS(app)

    # load configuration environment 
    config_name = config_name or os.getenv('FLASK_ENV', 'default')
    app.config.from_object(config[config_name])

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
    

    @app.route('/api/financials-compact/<symbol>', methods=["GET"])
    def stock_financials_compact(symbol):
        """
        Fetches a short list of key financial metrics for a stock 
        from the Finnhub client.
        """
        if not symbol:
            return jsonify({"error": "Stock symbol is required"}), 400

        try:
            raw = get_financials(symbol.upper())
            if not raw or "metric" not in raw:
                return jsonify({"error": f"No financial data for {symbol}"}), 404

            # narrow it down to our 18 fields
            data = extract_key_metrics(raw)

            return jsonify(data)
        except Exception as e:
            app.logger.error(f"Failed to fetch financials for {symbol}: {e}", exc_info=True)
            return jsonify({"error": "An internal server error occurred"}), 500
    

    @app.route('/api/financials-extended/<symbol>', methods=["GET"])
    def stock_financials_extended(symbol):
        """
        Fetches the raw stock financial data from the Finnhub client.
        """
        if not symbol:
            return jsonify({"error": "Stock symbol is required"}), 400

        try:
            financial_data = get_financials(symbol.upper())
            if not financial_data:
                return jsonify({"error": f"No profile data found for symbol {symbol}"}), 404
            return jsonify(financial_data)
        except Exception as e:
            app.logger.error(f"Failed to fetch profile for {symbol}: {e}", exc_info=True)
            return jsonify({"error": "An internal server error occurred"}), 500
    

    @app.route('/api/price/<symbol>', methods=["GET"])
    def realtime_price(symbol):
        """
        Fetches real-time stock price using the Finnhub client.
        """
        if not symbol:
            return jsonify({"error": "Stock symbol is required"}), 400

        try:
            price_data = get_quote_data(symbol.upper())
            if not price_data:
                return jsonify({"error": f"No price data found for symbol {symbol}"}), 404
            return jsonify(price_data)
        except Exception as e:
            app.logger.error(f"Failed to fetch real-time price for {symbol}: {e}", exc_info=True)
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


    @app.route('/api/trades/<symbol>', methods=["GET"])
    def get_trades_by_symbol(symbol):
        """
        Fetches all trade data for the given stock symbol from the Trade table.
        """
        if not symbol:
            return jsonify({"error": "Stock symbol is required"}), 400

        try:
            # Query the database for trades matching the symbol and sort by date (descending)
            trades = db.session.query(models.Trade).filter(
                models.Trade.traded_issuer_ticker.ilike(f"%{symbol.upper()}%")
            ).order_by(models.Trade.traded.desc()).all()

            if not trades:
                return jsonify({"error": f"No trade data found for symbol {symbol}"}), 404

            # Convert the trade data to a list of dictionaries
            trades_data = [trade.to_dict() for trade in trades]

            return jsonify(trades_data)
        except Exception as e:
            app.logger.error(f"Failed to fetch trades for {symbol}: {e}", exc_info=True)
            return jsonify({"error": "An internal server error occurred"}), 500


    @app.route('/api/trades', methods=["GET"])
    def get_recent_trades():
        """
        Fetches all trade data from the Trade table, sorted by trade date in descending order.
        """
        try:
            # Query the database for trades and sort by date (descending), no join, no limit
            trades = db.session.query(models.Trade).order_by(models.Trade.traded.desc()).all()

            if not trades:
                return jsonify({"error": "No trade data found"}), 404

            # Convert the trade data to a list of dictionaries
            trades_data = [trade.to_dict() for trade in trades]

            return jsonify(trades_data)
        except Exception as e:
            app.logger.error(f"Failed to fetch trades: {e}", exc_info=True)
            return jsonify({"error": "An internal server error occurred"}), 500


    @app.route("/api/prices/<symbol>", methods=["GET"])
    def daily_prices(symbol):
        """
        GET /api/prices/AAPL?start=2024-01-01&end=2024-02-01
        returns Tiingo daily OHLC data between those dates
        """
        # grab and validate query params
        start_date = request.args.get("start")
        end_date   = request.args.get("end")
        if not start_date or not end_date:
            return jsonify({
                "error": "Both 'start' and 'end' query parameters are required, in YYYY-MM-DD format."
            }), 400

        try:
            data = get_daily_prices(symbol, start_date, end_date)
            return jsonify({
                "symbol": symbol.upper(),
                "start":  start_date,
                "end":    end_date,
                "prices": data
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        

    @app.route('/api/autocomplete/stocks', methods=["GET"])
    def autocomplete_stocks():
        """
        return a list of stock symbols based on the search 
        """
        query = request.args.get('query', '').upper()
        if not query or len(query) < 1:
            return jsonify([])

        try:
            # search for stocks where symbol starts with input
            stocks = db.session.query(models.Stock).filter(
                db.or_(
                    models.Stock.symbol.ilike(f"{query}%"),
                    models.Stock.name.ilike(f"{query}%")
                )
            ).limit(10).all()

            # format results 
            results = [
                {
                    'symbol': stock.symbol,
                    'name': stock.name,
                }
                for stock in stocks
            ]

            return jsonify(results)
        except Exception as e:
            app.logger.error(f"error with stock autocomplete: {e}", exc_info=True)
            return jsonify([]), 500

    @app.route('/api/autocomplete/politicians', methods=["GET"])
    def autocomplete_politicians():
        """
        return a list of politicians based on the search
        """
        query = request.args.get('query', '').lower()
        if not query or len(query) < 1:
            return jsonify([])

        try:
            politicians = db.session.query(
                models.PoliticianImg
            ).filter(
                models.PoliticianImg.politician_name.ilike(f"{query}%")
            ).distinct().limit(10).all()

            results = [
                {
                    'name': politician.politician_name,
                    'affiliation': politician.politician_family,
                    'img': politician.img
                }
                for politician in politicians
            ]

            return jsonify(results)
        except Exception as e:
            app.logger.error(f"error with politician autocomplete: {e}", exc_info=True)
            return jsonify([]), 500

    @app.route('/api/pol/image', methods=["GET"])
    def get_pol_image():
        """
        Gets a politician image from database, filtered by politician name.
        Requires a 'name' parameter. Returns a single object or 404.
        """
        query = request.args.get('name', '')
        if not query or len(query) < 1:
            return jsonify({"error": "Query parameter 'name' is required."}), 400

        try:
            image = db.session.query(models.PoliticianImg).filter(
                func.lower(models.PoliticianImg.politician_name) == query.lower()
            ).first()
            if not image:
                return jsonify({"error": "No Image data found"}), 404
            return jsonify(image.to_dict())
        except Exception as e:
            app.logger.error(f"failed to fetch images: {e}", exc_info=True)
            return jsonify({"error": "an internal server error occured"}), 500

    def get_politician_total_spending(politician_name):
        trades = db.session.query(models.Trade.size).filter(
            models.Trade.politician_name == politician_name,
            models.Trade.size.isnot(None)
        ).all()
        
        total = 0
        for trade in trades:
            if trade.size:
                amount = size_to_numeric(trade.size)
                total += amount
        
        return total

    @app.route('/api/politicians/stats', methods=["GET"])
    def get_politician_stats():
        try:
            limit = request.args.get('limit', 500, type=int)
            min_trades = request.args.get('min_trades', 1, type=int)
        
            politician_query = db.session.query(
                models.Trade.politician_name,
                models.Trade.politician_family,
                func.count(models.Trade.id).label('trade_count'),
                func.count(func.distinct(models.Trade.traded_issuer_ticker)).label('stock_count'),
                func.max(models.Trade.traded).label('latest_trade')
            ).filter(
                models.Trade.politician_name.isnot(None)
            ).group_by(
                models.Trade.politician_name, 
                models.Trade.politician_family
            ).having(
                func.count(models.Trade.id) >= min_trades
            ).limit(limit).all()

            results = []
            for row in politician_query:
                # Get buy/sell counts separately calculation of metrics
                buy_count = db.session.query(func.count(models.Trade.id)).filter(
                    models.Trade.politician_name == row.politician_name,
                    models.Trade.type == 'buy'
                ).scalar() or 0
                
                sell_count = db.session.query(func.count(models.Trade.id)).filter(
                    models.Trade.politician_name == row.politician_name,
                    models.Trade.type == 'sell'
                ).scalar() or 0
                
                spending = get_politician_total_spending(row.politician_name)
                buy_percentage = (buy_count / row.trade_count * 100) if row.trade_count > 0 else 0
               
               
                # Trading profile attributes for each politician by aggregating their trades
                # name - name of the politician
                # party - political party affiliation
                # total_trades - total trades executed by the politician
                # buy_trades - total number of buy transactions
                # sell_trades - total number of sell transactions
                # buy_percentage - percentage of trade that were buys
                # estimated_spending - dollar amount spent
                # different_stocks - number of unique stocks traded by the politician
                # last_trade_date - most recent trade/transaction
                results.append({
                    'name': row.politician_name,
                    'party': row.politician_family or 'Unknown',
                    'total_trades': row.trade_count,
                    'buy_trades': buy_count,
                    'sell_trades': sell_count,
                    'buy_percentage': round(buy_percentage, 1),
                    'estimated_spending': spending,
                    'different_stocks': row.stock_count,
                    'last_trade_date': row.latest_trade.isoformat() if row.latest_trade else None
                })

            return jsonify({
                'count': len(results),
                'data': results
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/stocks/popular', methods=["GET"])
    def get_popular_stocks():
        try:
            limit = request.args.get('limit', 500, type=int)
            
            stock_stats = db.session.query(
                models.Trade.traded_issuer_ticker,
                models.Trade.traded_issuer_name,
                func.count(models.Trade.id).label('total_trades'),
                func.count(func.distinct(models.Trade.politician_name)).label('politician_count')
            ).filter(
                models.Trade.traded_issuer_ticker.isnot(None)
            ).group_by(
                models.Trade.traded_issuer_ticker,
                models.Trade.traded_issuer_name
            ).order_by(
                func.count(models.Trade.id).desc()
            ).limit(limit).all()

            stocks = []
            for stock in stock_stats:
                # Get buy/sell counts separately for calculation
                buys = db.session.query(func.count(models.Trade.id)).filter(
                    models.Trade.traded_issuer_ticker == stock.traded_issuer_ticker,
                    models.Trade.type == 'buy'
                ).scalar() or 0
                
                sells = db.session.query(func.count(models.Trade.id)).filter(
                    models.Trade.traded_issuer_ticker == stock.traded_issuer_ticker,
                    models.Trade.type == 'sell'
                ).scalar() or 0
                
                buy_ratio = (buys / stock.total_trades * 100) if stock.total_trades > 0 else 0
                
                # Stock trading summary by aggregating congressional trading data
                # symbol - like AAPL, TSLA
                # name - company name like Tesla Inc.
                # trade_count - number of trades for a specific stock
                # politician_count - number of unique politicians who traded the stock
                # buy_count - total number of buy transactions
                # sell_count - total number of sell transactions
                # buy_ratio - % of trades that were buys
                stocks.append({
                    'symbol': stock.traded_issuer_ticker,
                    'name': stock.traded_issuer_name,
                    'trade_count': stock.total_trades,
                    'politician_count': stock.politician_count,
                    'buy_count': buys,
                    'sell_count': sells,
                    'buy_ratio': round(buy_ratio, 1)
                })

            return jsonify({
                'count': len(stocks),
                'stocks': stocks
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return app
