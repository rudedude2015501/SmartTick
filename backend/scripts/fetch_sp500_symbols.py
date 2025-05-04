import requests
import csv
import io

def fetch_sp500_symbols(url: str) -> list[str]:
    """
    Fetches the S&P 500 company list CSV from `url` and returns
    a list of ticker symbols.
    """
    resp = requests.get(url)
    resp.raise_for_status()
    reader = csv.DictReader(io.StringIO(resp.text))
    symbols = [row["Symbol"].strip() for row in reader if row.get("Symbol")]
    return symbols

# if __name__ == "__main__":
#     symbols = fetch_sp500_symbols(CSV_URL)
#     for symbol in symbols:
#         print(symbol)