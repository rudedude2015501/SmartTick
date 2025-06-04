import os
import sys
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import Stock

def clear_stock_table():
    """
    Clears all existing data from the Stock table.
    """
    print("Clearing existing stock data from the database...")
    try:
        db.session.query(Stock).delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error clearing stock data: {e}")
        raise

def load_profile_data_from_file(file_path):
    """
    Loads JSON data from the given file path.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to load JSON file: {file_path}")
        print(f"Exception: {e}")
        raise

def process_stock_profiles(profile_data):
    """
    Processes stock profile records from JSON and prepares them for database insertion.
    """
    stocks_to_add = []
    print(f"Processing {len(profile_data)} stock profiles from JSON...")

    for i, record in enumerate(profile_data):
        stock = Stock(
            symbol=record.get('symbol'),
            name=record.get('name'),
            exchange=record.get('exchange'),
            industry=record.get('industry'),
            currency=record.get('currency'),
            country=record.get('country'),
            estimate_currency=record.get('estimate_currency'),
            ipo=record.get('ipo'),
            logo=record.get('logo'),
            market_capitalization=record.get('market_capitalization'),
            phone=record.get('phone'),
            shares_outstanding=record.get('shares_outstanding'),
            weburl=record.get('weburl')
        )
        stocks_to_add.append(stock)

    print(f"Finished processing JSON.")
    return stocks_to_add

def insert_stocks_into_db(stocks_to_add, chunk_size=100):
    """
    Inserts stock profiles into the database in chunks.
    """
    if not stocks_to_add:
        print("No stocks found in the JSON file to add.")
        return

    total_stocks = len(stocks_to_add)
    print(f"Preparing to add {total_stocks} stocks to the database in chunks of {chunk_size}...")

    for i in range(0, total_stocks, chunk_size):
        chunk = stocks_to_add[i:i + chunk_size]
        db.session.add_all(chunk)
        print(f"Added chunk {i // chunk_size + 1} to session...")

    try:
        print("\nCommitting changes to the database...")
        db.session.commit()
        print("Stock data loaded successfully.")
    except Exception as e:
        db.session.rollback()
        print("Failed to commit stock data to the database.")
        print(f"Exception: {e}")
        import traceback
        traceback.print_exc()
        print("Database changes have been rolled back.")

def load_profile_data():
    """
    Main function to load stock profile data into the database.
    """
    app = create_app()
    with app.app_context():
        file_path = 'data/profiles.json'

        try:
            profile_data = load_profile_data_from_file(file_path)
        except Exception:
            return

        try:
            clear_stock_table()
        except Exception:
            return

        stocks_to_add = process_stock_profiles(profile_data)
        insert_stocks_into_db(stocks_to_add)

if __name__ == '__main__':
    load_profile_data()