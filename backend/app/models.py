from . import db  # the db instance created in __init__.py

class Stock(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    symbol     = db.Column(db.String(10),  nullable=False, unique=True)
    name       = db.Column(db.String(128), nullable=False)
    exchange   = db.Column(db.String(32))
    sector     = db.Column(db.String(64))
    industry   = db.Column(db.String(128))
    currency   = db.Column(db.String(8),   default="USD")
    created_at = db.Column(db.DateTime,    server_default=db.func.now())