from datetime import datetime
from app import create_app, db
from app.models import Stock, StockPrice
from app.tiingo_client import get_daily_prices

def import_daily_prices(symbol: str, start: str, end: str):
    """
    Fetches daily OHLC data for `symbol` between `start` and `end` (YYYY-MM-DD),
    then inserts all returned rows into the stock_price table.
    """
    # 1) fetch from Tiingo
    data = get_daily_prices(symbol, start, end)

    app = create_app()
    with app.app_context():
        # 2) look up the Stock record
        stock = Stock.query.filter_by(symbol=symbol).first()
        if not stock:
            raise RuntimeError(f"No stock found for symbol {symbol!r}")

        # 3) build StockPrice objects
        price_objs = []
        for row in data:
            # parse ISO timestamp like '2024-06-05T00:00:00.000Z'
            date = datetime.fromisoformat(row['date'].replace('Z', '')).date()

            sp = StockPrice(
                stock_id   = stock.id,
                date       = date,
                open       = row.get('open'),
                high       = row.get('high'),
                low        = row.get('low'),
                close      = row.get('close'),
                volume     = row.get('volume'),
                adj_open   = row.get('adjOpen'),
                adj_high   = row.get('adjHigh'),
                adj_low    = row.get('adjLow'),
                adj_close  = row.get('adjClose'),
                adj_volume = row.get('adjVolume')
            )
            price_objs.append(sp)

        # 4) bulk insert and commit
        db.session.bulk_save_objects(price_objs)
        db.session.commit()
        print(f"Imported {len(price_objs)} rows for {symbol}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 4:
        print("Usage: python import_prices.py SYMBOL YYYY-MM-DD YYYY-MM-DD")
        sys.exit(1)

    _, symbol, start_date, end_date = sys.argv
    import_daily_prices(symbol, start_date, end_date)