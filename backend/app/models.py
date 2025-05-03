# SmartTick/backend/app/models.py
from sqlalchemy import Date, func # Added Date, func
# --- Import db from the package level (app) where it's initialized ---
from app import db

# Keep the Stock model as is
class Stock(db.Model):
    # __tablename__ = 'stock' # Optional: explicitly name table
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(128), nullable=False)
    exchange = db.Column(db.String(32))
    sector = db.Column(db.String(64))
    industry = db.Column(db.String(128))
    currency = db.Column(db.String(8))
    created_at = db.Column(db.DateTime, server_default=func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'name': self.name,
            'exchange': self.exchange,
            'sector': self.sector,
            'industry': self.industry,
            'currency': self.currency,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Define the Trade model
class Trade(db.Model):
    # __tablename__ = 'trade' # Optional: explicitly name table
    id = db.Column(db.Integer, primary_key=True)

    politician_name = db.Column(db.String(128), nullable=False)
    politician_family = db.Column(db.String(128))
    politician_link = db.Column(db.String(256))

    traded_issuer_name = db.Column(db.String(256), nullable=False)
    traded_issuer_ticker = db.Column(db.String(32)) # Ticker symbol (e.g., AAPL, MSFT:US)
    traded_issuer_link = db.Column(db.String(256))

    published = db.Column(db.String(64)) # Publication date string
    traded = db.Column(db.Date, nullable=True) # Use Date type for the trade date
    filed_after = db.Column(db.String(32))

    owner = db.Column(db.String(64))
    type = db.Column(db.String(16)) # 'buy' or 'sell'
    size = db.Column(db.String(64)) # Trade size range (e.g., '1K–15K')
    price = db.Column(db.String(32)) # Price string (e.g., '$153.18', 'N/A')
    created_at = db.Column(db.DateTime, server_default=func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'politician_name': self.politician_name,
            'politician_family': self.politician_family,
            'politician_link': self.politician_link,
            'traded_issuer_name': self.traded_issuer_name,
            'traded_issuer_ticker': self.traded_issuer_ticker,
            'traded_issuer_link': self.traded_issuer_link,
            'published': self.published,
            'traded': self.traded.isoformat() if self.traded else None, # Format date for JSON
            'filed_after': self.filed_after,
            'owner': self.owner,
            'type': self.type,
            'size': self.size,
            'price': self.price,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class StockPrice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    stock_id = db.Column(db.Integer, db.ForeignKey('stock.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)

    open = db.Column(db.Float)
    high = db.Column(db.Float)
    low = db.Column(db.Float)
    close = db.Column(db.Float)
    volume = db.Column(db.BigInteger)

    adj_close = db.Column(db.Float)
    adj_high = db.Column(db.Float)
    adj_low = db.Column(db.Float)
    adj_open = db.Column(db.Float)
    adj_volume = db.Column(db.Float)

    created_at = db.Column(db.DateTime, server_default=func.now())

    # Relationship back to Stock
    stock = db.relationship('Stock', backref=db.backref('prices', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'stock_id': self.stock_id,
            'date': self.date.isoformat() if self.date else None,

            'open': self.open,
            'high': self.high,
            'low': self.low,
            'close': self.close,
            'volume': self.volume,

            'adj_close': self.adj_close,
            'adj_high': self.adj_high,
            'adj_low': self.adj_low,
            'adj_open': self.adj_open,
            'adj_volume': self.adj_volume,

            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f"<StockPrice {self.date} Close={self.close}>"

