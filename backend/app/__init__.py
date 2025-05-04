import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from .finnhub_client import get_profile, get_quote_data
from scripts.scraper import getPolData  # Import the scraper function

# Shared extension objects
db = SQLAlchemy()
migrate = Migrate()

# App factory
def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    # Configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Import models here to register tables
    from . import models  # noqa: F401

    @app.route("/")
    def home():
        return "SmartTick backend is running"

    @app.route("/api/profile/<symbol>", methods=["GET"])
    def profile(symbol):
        try:
            # Fetch company profile
            profile_data = get_profile(symbol)
            return jsonify(profile_data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/trades", methods=["GET"])
    def trades():
        try:
            # Fetch all data from the scraper
            all_data = getPolData("PY")

            # Get query parameters for date range
            start_date = request.args.get("start_date")
            end_date = request.args.get("end_date")

            # Validate query parameters
            if not start_date or not end_date:
                return jsonify({"error": "Both 'start_date' and 'end_date' are required."}), 400

            # Filter trades by date range using string comparison
            filtered_trades = [
                trade for trade in all_data
                if start_date <= trade["transaction_date"] <= end_date
            ]

            return jsonify({"trades": filtered_trades, "count": len(filtered_trades)})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/quote/<symbol>", methods=["GET"])
    def quote(symbol):
        try:
            # Fetch quote data
            quote_data = get_quote_data(symbol)
            return quote_data
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return app