#Rudy CHavez 4/27/25
#A "webscraper" using a unique api to get regular data for free, using requests and beautiful soup 4
import requests
from bs4 import BeautifulSoup
import json

URL = "https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json"

#gets the political data from the above link and returns a python or JSON file:
def getPolData(RETURNTYPE:str):
    rData = requests.get(URL) #GET request
    soup = BeautifulSoup(rData.content, 'html5lib') # If this line causes an error, run 'pip install html5lib' or install html5lib
    # print(soup.prettify())
    if rData.status_code != 200:
        exit("Error with URL requests" + str(rData.status_code))
    #content returned is a JSON object containg a list of dictionaries, each containing the recent transaction
    if RETURNTYPE == "PY":
        return (json.loads(rData.content))
    elif RETURNTYPE == "JS":
        return (rData.content)


#testing
def test_scraper():
    print("testing scraper.py:")
    