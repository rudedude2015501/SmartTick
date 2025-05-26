#5/3/25
#script to gather treades form Capitol trades and write to 1yeartrade.json

import requests
from bs4 import BeautifulSoup
import json


CapitalTrades = "https://www.capitoltrades.com/trades?pageSize=96&page=1"

def checkIfEndOfPage(pageIndicators):
    """
    verifies that the page is no longer over the limit
    """
    if int(pageIndicators[0].text) > int(pageIndicators[1].text):
        return False
    else:
        return True
    

def getPage(pageNumber:int = 1):
    return f"https://www.capitoltrades.com/trades?pageSize=96&page={pageNumber}"

def fetchRequest(pageNumber:int = 1):
    response = requests.get(getPage(pageNumber)) #GET request
    if response.status_code != 200:
        raise Exception(f"Error with URL requests: {response.status_code}")
    
    PoliticianTable = BeautifulSoup(response.content, 'html5lib') # If this line causes an error, run 'pip install html5lib' or install html5lib
    PoliticianTable.prettify()
    Page_Indicators = (PoliticianTable.find("p", class_= "hidden leading-7 sm:block")).find_all("b")
    return PoliticianTable, Page_Indicators

def swapWords(string:str):
    """
    Swaps the number and days for "published after" column
    """
    words = string.split()
    return f"{words[1]} {words[0]}"

def getPolData():
    Trades = []
    Politicians = []
    page_number = 1
    
    PoliticianTable, pageIndicators = fetchRequest(page_number)
    
    while(checkIfEndOfPage(pageIndicators)):

        table = PoliticianTable.find_all("tr", class_= "border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800 h-14 border-primary-15")

        for tab in table:
            Trade = {}
            Politician = {} #gets politician name and profile
            Trade["politician_name"] = (tab.find('a',class_="text-txt-interactive")).text
            Politician["politician_name"] = (tab.find('a',class_="text-txt-interactive")).text
            Trade["politician_family"] = (tab.find('div',class_="politician-info mt-1 text-size-2 font-medium leading-none text-txt-dimmer").get_text(" "))
            Politician["politician_family"] = (tab.find('div',class_="politician-info mt-1 text-size-2 font-medium leading-none text-txt-dimmer").get_text(" "))
            Trade["politician_link"] = "N/A"
            Trade["traded_issuer_name"] =(tab.find('h3',class_="q-fieldset issuer-name")).text
            Trade["traded_issuer_ticker"] =(tab.find("span","q-field issuer-ticker")).text
            Trade["traded_issuer_link"] = "N/A"
            datesPublishedAndPosted = tab.find_all("div",class_="text-center")
            Trade["published"] = datesPublishedAndPosted[0].get_text(" ")
            Trade["traded"] = datesPublishedAndPosted[1].get_text(" ")
            raw_filed_after = (tab.find("div", class_="q-cell cell--reporting-gap flavour--lv")).get_text(" ")
            Trade["filed_after"] = swapWords(raw_filed_after)
            Trade["owner"] =(tab.find("span",class_="q-label")).get_text(" ")

            TradeType =tab.find("span", class_=["q-field tx-type tx-type--sell has-asterisk","q-field tx-type tx-type--buy has-asterisk","q-field tx-type tx-type--buy","q-field tx-type tx-type--sell"])
            if TradeType == None:
                Trade["type"] = "Tradetype is none"
            else:
                Trade["type"] = TradeType.text
            size =(tab.find("span","mt-1 text-size-2 text-txt-dimmer hover:text-foreground")).get_text(" ")
            Trade["size"] = size.replace("\u2013","-")
            Trade["price"] =(tab.find("div","flex place-content-center px-2 lg:px-3 xl:px-6 justify-end pr-0")).text
            img = tab.find_all("img")
            Politician["img"] = img[0]["src"]
            Trades.append(Trade)
            if Politician not in Politicians:
                Politicians.append(Politician)
        page_number += 1
        PoliticianTable, pageIndicators = fetchRequest(page_number)
        print(Trades[-1], end=f"\npage:{page_number}\n") #indicates if working


    with open ("backend/1yeartrade.json", "w+") as fs:
        json.dump(Trades,fs,indent=2)
        print("trades success")
    with open ("backend/PoliticianPhotos.json", "w+") as fs:
        json.dump(Politicians,fs,indent=2)
        print("img success")

getPolData()