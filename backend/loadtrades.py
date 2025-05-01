# SmartTick/backend/loadtrades.py
import json
from datetime import datetime # Import datetime
from app import create_app, db
from app.models import Trade

# --- Helper function to parse date strings ---
def parse_trade_date(date_str):
    """
    Parses date strings like '3 Apr 2025' or '3 Sept 2024' into date objects.
    Handles potential errors or different formats gracefully.
    """
    if not date_str:
        return None

    # *** Modification: Replace 'Sept' with 'Sep' for consistent parsing ***
    processed_date_str = date_str.replace('Sept', 'Sep')

    try:
        # Attempt parsing with the standard format
        return datetime.strptime(processed_date_str, '%d %b %Y').date()
    except ValueError:
        # Log warning if parsing still fails after replacement
        print(f"Warning: Could not parse date string: {date_str} (processed as: {processed_date_str})")
        return None
# --- End Helper function ---

def load_trade_data():
    """Loads trade data from 1yeartrade.json into the database."""
    app = create_app()
    with app.app_context():
        try:
            # Ensure the file path is correct relative to where the script runs
            with open('1yeartrade.json', 'r', encoding='utf-8') as f:
                trade_data = json.load(f)
        except FileNotFoundError:
            print("Error: 1yeartrade.json not found. Ensure it's in the SmartTick/backend/ directory.")
            return
        except json.JSONDecodeError:
            print("Error: Could not decode JSON from 1yeartrade.json.")
            return

        # --- Clear the Trade table before inserting new data ---
        print("Clearing existing trade data from the database...")
        try:
            db.session.query(Trade).delete()  # Deletes all rows in the Trade table
            db.session.commit()
            print("Existing trade data cleared successfully.")
        except Exception as e:
            db.session.rollback()
            print(f"Error clearing trade data: {e}")
            return

        trades_to_add = []
        print(f"Processing {len(trade_data)} trades from JSON...")
        successful_parses = 0
        failed_parses = 0

        for i, record in enumerate(trade_data):
            trade_date_str = record.get('traded')
            trade_date = parse_trade_date(trade_date_str)

            # Keep track of parsing success/failure
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
                traded=trade_date,  # Use the parsed date object (can be None)
                filed_after=record.get('filed_after'),
                owner=record.get('owner'),
                type=record.get('type'),
                size=record.get('size'),
                price=record.get('price')
            )
            trades_to_add.append(trade)

            # Optional: Print progress periodically
            if (i + 1) % 5000 == 0:  # Print less often for large files
                print(f"Processed {i + 1} records...")

        print(f"\nFinished processing JSON.")
        print(f"Successfully parsed {successful_parses} dates.")
        if failed_parses > 0:
            print(f"Failed to parse {failed_parses} dates (see warnings above).")

        if trades_to_add:
            print(f"\nAdding {len(trades_to_add)} trades to the database session...")
            # Add in chunks to potentially manage memory better (optional)
            chunk_size = 5000
            for i in range(0, len(trades_to_add), chunk_size):
                chunk = trades_to_add[i:i + chunk_size]
                db.session.add_all(chunk)
                print(f"Added chunk {i // chunk_size + 1} to session...")

            try:
                print("\nCommitting changes to the database...")
                db.session.commit()
                print("Trade data loaded successfully.")
            except Exception as e:
                db.session.rollback()  # Rollback on error
                print(f"\n--- Database Commit Error ---")
                print(f"An error occurred: {e}")
                print("Database changes have been rolled back.")
                import traceback
                traceback.print_exc()
                print("-----------------------------\n")
        else:
            print("No trades found in the JSON file to add.")


if __name__ == '__main__':
    load_trade_data()

