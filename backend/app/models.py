# SmartTick/backend/app/models.py
from sqlalchemy import Date, func # Added Date, func
from sqlalchemy.sql import func

# --- Import db from the package level (app) where it's initialized ---
from app import db


# Stock Profile
class Stock(db.Model):
    id                    = db.Column(db.Integer, primary_key=True)
    symbol                = db.Column(db.String(10),   unique=True, nullable=False)  # ticker
    name                  = db.Column(db.String(128),  nullable=False)
    exchange              = db.Column(db.String(64))
    sector                = db.Column(db.String(64))    # you can leave or drop if unused
    industry              = db.Column(db.String(128))   # maps from finnhubIndustry
    currency              = db.Column(db.String(8))
    
    # ─── NEW FIELDS ──────────────────────────────────────────────
    country               = db.Column(db.String(64))
    estimate_currency     = db.Column(db.String(8))
    ipo                   = db.Column(db.Date)
    logo                  = db.Column(db.String(256))
    market_capitalization = db.Column(db.Float)
    phone                 = db.Column(db.String(32))
    shares_outstanding    = db.Column(db.Float)
    weburl                = db.Column(db.String(256))
    # ──────────────────────────────────────────────────────────────

    created_at            = db.Column(db.DateTime, server_default=func.now())

    metrics = db.relationship('StockMetric', back_populates='stock', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':                    self.id,
            'symbol':                self.symbol,
            'name':                  self.name,
            'exchange':              self.exchange,
            'sector':                self.sector,
            'industry':              self.industry,
            'currency':              self.currency,
            'country':               self.country,
            'estimate_currency':     self.estimate_currency,
            'ipo':                   self.ipo.isoformat() if self.ipo else None,
            'logo':                  self.logo,
            'market_capitalization': self.market_capitalization,
            'phone':                 self.phone,
            'shares_outstanding':    self.shares_outstanding,
            'weburl':                self.weburl,
            'created_at':            self.created_at.isoformat() if self.created_at else None
        }

# Stock Financial Information
class StockMetric(db.Model):
    __tablename__ = 'stock_metric'
    id                          = db.Column(db.Integer, primary_key=True)
    stock_id                    = db.Column(
                                      db.Integer,
                                      db.ForeignKey('stock.id'),
                                      nullable=False
                                  )
    as_of_date                   = db.Column(
                                      Date,
                                      nullable=False,
                                      server_default=func.current_date()
                                  )

    # ─── Selected Subset of Finnhub metrics ─────────────────────────────────────────
    ten_day_avg_volume          = db.Column('10d_avg_vol',   db.Float)
    thirteen_week_return        = db.Column('13w_ret',       db.Float)
    fifty_two_wk_high           = db.Column('52w_high',      db.Float)
    fifty_two_wk_high_date      = db.Column('52w_high_dt',   Date)
    fifty_two_wk_low            = db.Column('52w_low',       db.Float)
    fifty_two_wk_low_date       = db.Column('52w_low_dt',    Date)
    beta                        = db.Column(db.Float)
    pe_ttm                      = db.Column(db.Float)
    pb                          = db.Column(db.Float)
    ps_ttm                      = db.Column(db.Float)
    dividend_yield_ttm          = db.Column(db.Float)
    current_ratio_quarterly     = db.Column(db.Float)
    quick_ratio_quarterly       = db.Column(db.Float)
    roe_ttm                     = db.Column(db.Float)
    roa_ttm                     = db.Column(db.Float)
    eps_ttm                     = db.Column(db.Float)
    rev_per_share_ttm           = db.Column(db.Float)
    rev_growth_ttm_yoy          = db.Column(db.Float)
    eps_growth_ttm_yoy          = db.Column(db.Float)
    # ──────────────────────────────────────────────────────────────────────

    created_at                  = db.Column(db.DateTime, server_default=func.now())

    stock                       = db.relationship('Stock', back_populates='metrics')

    def to_dict(self):
        return {
            'id': self.id,
            'stock_id': self.stock_id,
            'as_of_date': self.as_of_date.isoformat(),
            '10d_avg_vol': self.ten_day_avg_volume,
            '13w_ret': self.thirteen_week_return,
            '52w_high': self.fifty_two_wk_high,
            '52w_high_dt': self.fifty_two_wk_high_date.isoformat() if self.fifty_two_wk_high_date else None,
            '52w_low': self.fifty_two_wk_low,
            '52w_low_dt': self.fifty_two_wk_low_date.isoformat() if self.fifty_two_wk_low_date else None,
            'beta': self.beta,
            'pe_ttm': self.pe_ttm,
            'pb': self.pb,
            'ps_ttm': self.ps_ttm,
            'dividend_yield_ttm': self.dividend_yield_ttm,
            'current_ratio_quarterly': self.current_ratio_quarterly,
            'quick_ratio_quarterly': self.quick_ratio_quarterly,
            'roe_ttm': self.roe_ttm,
            'roa_ttm': self.roa_ttm,
            'eps_ttm': self.eps_ttm,
            'rev_per_share_ttm': self.rev_per_share_ttm,
            'rev_growth_ttm_yoy': self.rev_growth_ttm_yoy,
            'eps_growth_ttm_yoy': self.eps_growth_ttm_yoy,
            'created_at': self.created_at.isoformat()
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
