# Standard library imports
import os
import re
from datetime import date

# Third-party imports
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from flask_cors import CORS
from sqlalchemy import func, case, cast, Float

# Api client imports
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
            models.Trade.traded_issuer_ticker.ilike(f"%{base_symbol}%"),
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

            trades_data = [trade.to_dict() for trade in trades]

            return jsonify(trades_data)
        except Exception as e:
            app.logger.error(f"Failed to fetch trades for {symbol}: {e}", exc_info=True)
            return jsonify({"error": "An internal server error occurred"}), 500


    @app.route('/api/trades', methods=["GET"])
    def get_recent_trades():
        """
        Fetches all trade data from the Trade table, sorted by trade date in descending order.
        Includes politician image if available.
        """
        try:
            # Outer join Trade with PoliticianImg on politician_name
            trades = db.session.query(
                models.Trade,
                models.PoliticianImg.img
            ).outerjoin(
                models.PoliticianImg,
                models.Trade.politician_name == models.PoliticianImg.politician_name
            ).order_by(models.Trade.traded.desc()).all()

            if not trades:
                return jsonify({"error": "No trade data found"}), 404

            trades_data = []
            for trade, img in trades:
                trade_dict = trade.to_dict()
                if img:
                    trade_dict['img'] = f"https://www.capitoltrades.com{img}"
                else:
                    trade_dict['img'] = None
                trades_data.append(trade_dict)

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
            stocks = db.session.query(models.Stock).filter(
                db.or_(
                    models.Stock.symbol.ilike(f"{query}%"),
                    models.Stock.name.ilike(f"{query}%")
                )
            ).limit(10).all()

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
            img_dict = image.to_dict()
            if img_dict.get("img"):
                img_dict["img"] = f"https://www.capitoltrades.com{img_dict['img']}"
            return jsonify(img_dict)
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
                func.max(models.Trade.traded).label('latest_trade'),
                func.sum(case((models.Trade.type == 'buy', 1), else_=0)).label('buy_count'),
                func.sum(case((models.Trade.type == 'sell', 1), else_=0)).label('sell_count')
            ).filter(
                models.Trade.politician_name.isnot(None)
            ).group_by(
                models.Trade.politician_name, 
                models.Trade.politician_family
            ).having(
                func.count(models.Trade.id) >= min_trades
            ).limit(limit).all()

            # --- Optimization: Fetch all relevant trades in one query ---
            pol_names = [row.politician_name for row in politician_query]
            all_trades = db.session.query(
                models.Trade.politician_name,
                models.Trade.size
            ).filter(
                models.Trade.politician_name.in_(pol_names),
                models.Trade.size.isnot(None)
            ).all()

            spending_map = {}
            for pol_name, size in all_trades:
                if pol_name not in spending_map:
                    spending_map[pol_name] = 0
                if size:
                    spending_map[pol_name] += size_to_numeric(size)

            results = []
            for row in politician_query:
                buy_percentage = (row.buy_count / row.trade_count * 100) if row.trade_count > 0 else 0
                estimated_spending = spending_map.get(row.politician_name, 0)
                results.append({
                    'name': row.politician_name,
                    'party': row.politician_family or 'Unknown',
                    'total_trades': row.trade_count,
                    'buy_trades': row.buy_count,
                    'sell_trades': row.sell_count,
                    'buy_percentage': round(buy_percentage, 1),
                    'estimated_spending': estimated_spending,
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
                func.count(func.distinct(models.Trade.politician_name)).label('politician_count'),
                func.sum(case((models.Trade.type == 'buy', 1), else_=0)).label('buy_count'),
                func.sum(case((models.Trade.type == 'sell', 1), else_=0)).label('sell_count')
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
                buy_ratio = (stock.buy_count / stock.total_trades * 100) if stock.total_trades > 0 else 0
                stocks.append({
                    'symbol': stock.traded_issuer_ticker,
                    'name': stock.traded_issuer_name,
                    'trade_count': stock.total_trades,
                    'politician_count': stock.politician_count,
                    'buy_count': stock.buy_count,
                    'sell_count': stock.sell_count,
                    'buy_ratio': round(buy_ratio, 1)
                })

            return jsonify({
                'count': len(stocks),
                'stocks': stocks
            })

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/politicians/<name>/latest-trade', methods=["GET"])
    def get_politician_latest_trade(name):
        """
        Returns the most recent trade for the given politician.
        """
        if not name or len(name) < 1:
            return jsonify({"error": "Politician name is required."}), 400

        try:
            trade = db.session.query(models.Trade).filter(
                models.Trade.politician_name == name
            ).order_by(models.Trade.traded.desc()).first()
            if not trade:
                return jsonify({"error": "No trades found for this politician."}), 404
            return jsonify(trade.to_dict())
        except Exception as e:
            app.logger.error(f"Failed to fetch latest trade for {name}: {e}", exc_info=True)
            return jsonify({"error": "An internal server error occurred"}), 500

    @app.route('/api/politicians/<name>/biggest-trade', methods=["GET"])
    def get_politician_biggest_trade(name):
        """
        Returns the trade with the largest size for the given politician.
        """
        if not name or len(name) < 1:
            return jsonify({"error": "Politician name is required."}), 400

        try:
            trades = db.session.query(models.Trade).filter(
                models.Trade.politician_name == name,
                models.Trade.size.isnot(None)
            ).all()
            if not trades:
                return jsonify({"error": "No trades found for this politician."}), 404

            # Find the trade with the largest numeric size
            biggest_trade = max(
                trades,
                key=lambda t: size_to_numeric(t.size) if t.size else 0
            )
            return jsonify(biggest_trade.to_dict())
        except Exception as e:
            app.logger.error(f"Failed to fetch biggest trade for {name}: {e}", exc_info=True)
            return jsonify({"error": "An internal server error occurred"}), 500

    @app.route('/api/politicians/<name>/stats', methods=["GET"])
    def get_single_politician_stats(name):
        """
        Returns stats for a single searched politician.
        """
        if not name or len(name) < 1:
            return jsonify({"error": "Politician name is required."}), 400

        try:
            row = db.session.query(
                models.Trade.politician_name,
                func.count(models.Trade.id).label('trade_count')
            ).filter(
                models.Trade.politician_name == name
            ).group_by(
                models.Trade.politician_name
            ).first()

            if not row:
                return jsonify({"error": "No stats found for this politician."}), 404

            # Calculate estimated spending for this politician
            trades = db.session.query(models.Trade.size).filter(
                models.Trade.politician_name == name,
                models.Trade.size.isnot(None)
            ).all()
            estimated_spending = sum(size_to_numeric(t.size) for t in trades if t.size)

            result = {
                'name': row.politician_name,
                'total_trades': row.trade_count,
                'estimated_spending': estimated_spending
            }

            return jsonify(result)

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return app
