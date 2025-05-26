import os
import sys

# --- Add the project root ("/app") to sys.path so we can import app modules ---
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import time
from finnhub.exceptions import FinnhubAPIException

from app import create_app, db
from app.models import Stock
from app.finnhub_client import get_profile
from scripts.fetch_sp500_symbols import fetch_sp500_symbols  # not relative since it's a script

# --- 1) Get list of symbols (S&P 500)
SYMBOLS = fetch_sp500_symbols()

# --- 2) Mapping from Finnhub keys to your model attributes ---
FIELD_MAP = {
    'ticker':               'symbol',
    'name':                 'name',
    'exchange':             'exchange',
    'finnhubIndustry':      'industry',
    'currency':             'currency',
    'country':              'country',
    'estimateCurrency':     'estimate_currency',
    'ipo':                  'ipo',
    'logo':                 'logo',                # assumes Stock.logo column exists
    'marketCapitalization': 'market_capitalization',
    'phone':                'phone',
    'shareOutstanding':     'shares_outstanding',
    'weburl':               'weburl',
}

def import_profiles(symbols):
    app = create_app()
    with app.app_context():
        processed = 0

        for symbol in symbols:
            # —— retry loop for rate-limit errors ——
            while True:
                try:
                    data = get_profile(symbol)
                    break
                except FinnhubAPIException as e:
                    # FinhubAPIException has .status_code
                    if getattr(e, "status_code", None) == 429:
                        print(f"⚠️  Rate limit reached. Sleeping for 60s before retrying {symbol}…")
                        time.sleep(60)
                    else:
                        print(f"⚠️  API error for {symbol}: {e}")
                        data = None
                        break

            if not data:
                print(f"⚠️  no data for {symbol}")
                continue

            # —— build the kwargs for upsert ——
            stock_kwargs = { model_attr: data.get(api_key)
                             for api_key, model_attr in FIELD_MAP.items() }

            # —— upsert (insert or update) ——            
            existing = Stock.query.filter_by(symbol=stock_kwargs['symbol']).first()
            if existing:
                for attr, val in stock_kwargs.items():
                    setattr(existing, attr, val)
                db.session.commit()
                print(f"🔄 Updated {symbol}")
            else:
                new_stock = Stock(**stock_kwargs)
                db.session.add(new_stock)
                db.session.commit()
                print(f"➕ Inserted {symbol}")

            processed += 1

            # —— throttle to ≤60 calls/minute ——  
            time.sleep(1)

        print(f"\n🎉 Done. Processed {processed}/{len(symbols)} symbols.")

if __name__ == '__main__':
    # Optionally allow passing symbols via command-line
    symbols = SYMBOLS
    if len(sys.argv) > 1:
        symbols = sys.argv[1:]

    import_profiles(symbols)