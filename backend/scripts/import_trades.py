import os
import sys
import json
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import Trade


def parse_trade_date(date_str):
    """
    Parses date strings like '3 Apr 2025' or '3 Sept 2024' into date objects.
    Handles potential errors or different formats gracefully.
    """
    if not date_str:
        return None

    processed_date_str = date_str.replace('Sept', 'Sep')  # Normalize date format

    try:
        return datetime.strptime(processed_date_str, '%d %b %Y').date()
    except ValueError:
        print(f"Warning: Could not parse date string: {date_str} (processed as: {processed_date_str})")
        return None


def clear_trade_table():
    """
    Clears all existing data from the Trade table.
    """
    print("Clearing existing trade data from the database...")
    try:
        db.session.query(Trade).delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error clearing trade data: {e}")
        raise


def load_trade_data_from_file(file_path):
    """
    Loads trade data from a JSON file.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {file_path} not found. Ensure it's in the correct directory.")
        raise
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {file_path}.")
        raise


def process_trade_records(trade_data):
    """
    Processes trade records from JSON and prepares them for database insertion.
    """
    trades_to_add = []
    print(f"Processing {len(trade_data)} trades from JSON...")
    successful_parses = 0
    failed_parses = 0

    for i, record in enumerate(trade_data):
        trade_date_str = record.get('traded')
        trade_date = parse_trade_date(trade_date_str)

        if trade_date_str and not trade_date:
            failed_parses += 1
        elif trade_date:
            successful_parses += 1

        trade = Trade(
            politician_name=record.get('politician_name'),
            politician_family=record.get('politician_family'),
            politician_link=record.get('politician_link'),
            traded_issuer_name=record.get('traded_issuer_name'),
            traded_issuer_ticker=record.get('traded_issuer_ticker'),
            traded_issuer_link=record.get('traded_issuer_link'),
            published=record.get('published'),
            traded=trade_date,
            filed_after=record.get('filed_after'),
            owner=record.get('owner'),
            type=record.get('type'),
            size=record.get('size'),
            price=record.get('price')
        )
        trades_to_add.append(trade)

        if (i + 1) % 2000 == 0:
            print(f"Processed {i + 1} records...")

    print(f"\nFinished processing JSON.")
    print(f"Successfully parsed {successful_parses} dates.")
    if failed_parses > 0:
        print(f"Failed to parse {failed_parses} dates (see warnings above).")

    return trades_to_add


def insert_trades_into_db(trades_to_add, chunk_size=5000):
    """
    Inserts trades into the database in chunks.
    """
    if not trades_to_add:
        print("No trades found in the JSON file to add.")
        return

    total_trades = len(trades_to_add)
    print(f"Preparing to add {total_trades} trades to the database in chunks of {chunk_size}...")

    for i in range(0, total_trades, chunk_size):
        chunk = trades_to_add[i:i + chunk_size]
        db.session.add_all(chunk)
        print(f"Added chunk {i // chunk_size + 1} to session...")

    try:
        print("\nCommitting changes to the database...")
        db.session.commit()
        print("Trade data loaded successfully.")
    except Exception as e:
        db.session.rollback()
        print("Failed to commit trade data to the database.")
        print(f"Exception: {e}")
        import traceback
        traceback.print_exc()
        print("Database changes have been rolled back.")


def load_trade_data():
    """
    Main function to load trade data into the database.
    """
    app = create_app()
    with app.app_context():
        file_path = '1yeartrade.json'

        try:
            trade_data = load_trade_data_from_file(file_path)
        except Exception:
            return

        try:
            clear_trade_table()
        except Exception:
            return

        trades_to_add = process_trade_records(trade_data)
        insert_trades_into_db(trades_to_add)


if __name__ == '__main__':
    load_trade_data()
