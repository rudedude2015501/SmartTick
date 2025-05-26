import os
import sys
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models import PoliticianImg

def clear_image_table():
    """
    Clears all existing data from the PoliticianImg table.
    """
    print("Clearing existing politician image data from the database...")
    try:
        db.session.query(PoliticianImg).delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error clearing image data: {e}")
        raise
      
def load_image_data_from_file(file_path):
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

def process_politician_images(image_data):
    """
    Processes politician image records from JSON and prepares them for database insertion.
    """
    imgs_to_add = []
    print(f"Processing {len(image_data)} politician images from JSON...")

    for i, record in enumerate(image_data):
        img = PoliticianImg(
            politician_name=record.get('politician_name'),
            politician_family=record.get('politician_family'),
            img=record.get('img')
        )
        imgs_to_add.append(img)

    print(f"Finished processing JSON.")
    return imgs_to_add

def insert_images_into_db(imgs_to_add, chunk_size=100):
    """
    Inserts politician images into the database in chunks.
    """
    if not imgs_to_add:
        print("No images found in the JSON file to add.")
        return

    total_imgs = len(imgs_to_add)
    print(f"Preparing to add {total_imgs} images to the database in chunks of {chunk_size}...")

    for i in range(0, total_imgs, chunk_size):
        chunk = imgs_to_add[i:i + chunk_size]
        db.session.add_all(chunk)
        print(f"Added chunk {i // chunk_size + 1} to session...")

    try:
        print("\nCommitting changes to the database...")
        db.session.commit()
        print("Image data loaded successfully.")
    except Exception as e:
        db.session.rollback()
        print("Failed to commit image data to the database.")
        print(f"Exception: {e}")
        import traceback
        traceback.print_exc()
        print("Database changes have been rolled back.")

def load_image_data():
    """
    Main function to load politician image data into the database.
    """
    app = create_app()
    with app.app_context():
        file_path = 'data/PoliticianPhotos.json'

        try:
            image_data = load_image_data_from_file(file_path)
        except Exception:
            return

        try:
            clear_image_table()
        except Exception:
            return

        imgs_to_add = process_politician_images(image_data)
        insert_images_into_db(imgs_to_add)

if __name__ == '__main__':
    load_image_data()