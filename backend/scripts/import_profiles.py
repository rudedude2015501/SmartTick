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

SYMBOLS_URL = "https://storage.googleapis.com/kagglesdsdata/datasets/1807380/10273516/sp500_companies.csv?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=gcp-kaggle-com%40kaggle-161607.iam.gserviceaccount.com%2F20250504%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20250504T053436Z&X-Goog-Expires=259200&X-Goog-SignedHeaders=host&X-Goog-Signature=6ae441ddf30a163830991b26d4866c09799bfc057b8b36493bf38a1a265926779936a6210f848fae37d258dd2fb9540c3ce391bec64c5b2591950b3b93e46f9c87e0ea4a85accb91080d699aa1a7e0c5298771acf157fd7c71220fe1d7d08a993f10922102459396500fa23abed40fd4fe04124780b7d60ce40a4ce1e2f1ce6e5b0c3ad46732f47267931580cac698d79f51315ad9f601c4692a778b24d20fca62e6d0930b60f503232652e6548a7ae1fafb13e6ff1a653f6a8f6fbd97416695d3660de46e302c3114e57e37c4ca7acfc18bec8299e122140f8cd3b9a244c426270aa31e697344e8047e5ca73ccb17829b523c0d2fe0c889c7b8071d7d0418b4"

# --- 1) Get list of symbols (S&P 500)
SYMBOLS = fetch_sp500_symbols(SYMBOLS_URL)

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