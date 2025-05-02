import requests
import json

URL = "https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json"

def getPolData(RETURNTYPE: str):
    # Fetch the data from the API
    response = requests.get(URL)
    if response.status_code != 200:
        raise Exception(f"Error with URL requests: {response.status_code}")
    
    # Return data in the requested format
    if RETURNTYPE == "PY":
        return response.json()  # Return Python object
    elif RETURNTYPE == "JS":
        return response.text  # Return raw JSON string
    else:
        raise ValueError("Invalid RETURNTYPE. Use 'PY' or 'JS'.")