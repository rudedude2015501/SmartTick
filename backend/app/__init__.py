from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# ── 1.  shared extension objects ────────────────────────────
db = SQLAlchemy()          # models will import this
migrate = Migrate()        # flask db … commands come from this

# ── 2.  app factory ─────────────────────────────────────────
def create_app() -> Flask:
    app = Flask(__name__)

    # ---- configuration ----
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "postgresql://smarttick:cse115a@db:5432/tickdb"
    )
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

    return app