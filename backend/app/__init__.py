import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from .finnhub_client import get_profile

# ── 1.  shared extension objects ────────────────────────────
db = SQLAlchemy()          # models will import this
migrate = Migrate()        # flask db … commands come from this

# ── 2.  app factory ─────────────────────────────────────────
def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    # ---- configuration ----
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ---- initialise extensions ----
    db.init_app(app)
    migrate.init_app(app, db)

    # ---- import models here to register tables ----
    # (after db is ready, avoids circular‑import issues)
    from . import models  # noqa: F401

    @app.route("/")
    def home():
        return "SmartTick backend is running"
    
    @app.route("/api/profile/<symbol>", methods=["GET"])
    def profile(symbol):
        try:
            # Call the get_profile function to fetch company profile
            profile_data = get_profile(symbol)
            return jsonify(profile_data)  # Return the profile as JSON
        except Exception as e:
            # Handle errors and return a 500 status code
            return jsonify({"error": str(e)}), 500
    return app