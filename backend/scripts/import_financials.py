import os
import sys
import time
from finnhub.exceptions import FinnhubAPIException

# ─── Make sure the app package is on our path ────────────────────────────────
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import Stock, StockMetric
from app.finnhub_client import get_financials
from app.utils import extract_key_metrics
from scripts.fetch_sp500_symbols import fetch_sp500_symbols  # or your own symbol list

# 1) Get list of symbols (S&P 500 or whatever you prefer)
SYMBOLS = fetch_sp500_symbols()


def import_financials(symbols):
    app = create_app()
    with app.app_context():
        processed = 0

        for symbol in symbols:
            symbol = symbol.upper().strip()
            print(f"⏳ Processing {symbol}...")

            # —— retry loop for rate-limit errors ——
            while True:
                try:
                    resp = get_financials(symbol)
                    break
                except FinnhubAPIException as e:
                    if getattr(e, "status_code", None) == 429:
                        print(f"⚠️  Rate limit hit. Sleeping 60s before retrying {symbol}…")
                        time.sleep(60)
                        continue
                    else:
                        print(f"⚠️  API error for {symbol}: {e}")
                        resp = None
                        break

            # If no usable data, skip
            if not resp or "metric" not in resp:
                print(f"⚠️  No financial data for {symbol}, skipping.")
                continue

            # Extract just our key metrics
            metrics_payload = extract_key_metrics(resp)

            # Look up the Stock entry
            stock = Stock.query.filter_by(symbol=symbol).first()
            if not stock:
                print(f"⚠️  Stock {symbol} not in DB, skipping.")
                continue

            # Build a new StockMetric record
            metric_entry = StockMetric(
                stock_id=stock.id,
                **metrics_payload
            )
            db.session.add(metric_entry)

            # Commit (with rollback on failure)
            try:
                db.session.commit()
                processed += 1
            except Exception as e:
                db.session.rollback()
                print(f"⚠️  DB error for {symbol}: {e}")
                continue

            # —— throttle to ≤60 calls/minute ——  
            time.sleep(1)

        print(f"\n🎉 Done. Processed {processed}/{len(symbols)} symbols.")


if __name__ == '__main__':
    symbols = SYMBOLS
    if len(sys.argv) > 1:
        symbols = sys.argv[1:]
    import_financials(symbols)