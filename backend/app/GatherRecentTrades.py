#5/3/25
#script to gather treades form Capitol trades and write to 1yeartrade.json

import requests
from bs4 import BeautifulSoup
import json


CapitalTrades = "https://www.capitoltrades.com/trades?pageSize=96&page=1"

def getPolData():
    response = requests.get(CapitalTrades) #GET request
    soup = BeautifulSoup(response.content, 'html5lib') # If this line causes an error, run 'pip install html5lib' or install html5lib
    # print(soup.prettify())
    if response.status_code != 200:
        raise Exception(f"Error with URL requests: {response.status_code}")

    soup.prettify()
    
    table = soup.find_all("tr", class_= "border-b transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800 h-14 border-primary-15")

    
    
    # buySell = table[0].find("span", class_=["q-field tx-type tx-type--sell has-asterisk","q-field tx-type tx-type--buy has-asterisk",\
    #                                             "q-field tx-type tx-type--buy","q-field tx-type tx-type--sell"])
    
    # print(buySell.text)
    Trades = []
    for tab in table:
        Trade = {}
        Trade["politician_name"] = (tab.find('a',class_="text-txt-interactive")).text
        Trade["politician_family"] = (tab.find('div',class_="politician-info mt-1 text-size-2 font-medium leading-none text-txt-dimmer").text)
        Trade["politician_link"] = "N/A"
        Trade["traded_issuer_name"] =(tab.find('h3',class_="q-fieldset issuer-name")).text
        Trade["traded_issuer_ticker"] =(tab.find("span","q-field issuer-ticker")).text
        Trade["traded_issuer_link"] = "N/A"
        datesPublishedAndPosted = tab.find_all("div",class_="text-center")
        Trade["published"] = datesPublishedAndPosted[0].text
        Trade["traded"] = datesPublishedAndPosted[1].text
        Trade["filed_after"] =(tab.find("div",class_="q-cell cell--reporting-gap flavour--lv")).text
        Trade["owner"] =(tab.find("span",class_="q-label")).text
        Trade["type"] =(tab.find("span", class_=["q-field tx-type tx-type--sell has-asterisk","q-field tx-type tx-type--buy has-asterisk",\
                                               "q-field tx-type tx-type--buy","q-field tx-type tx-type--sell"])).text
        Trade["size"] =(tab.find("span","mt-1 text-size-2 text-txt-dimmer hover:text-foreground")).text
        Trade["price"] =(tab.find("div","flex place-content-center px-2 lg:px-3 xl:px-6 justify-end pr-0")).text

        Trades.append(Trade)
    with open ("1yeartrade.json", "w") as fs:
        json.dump(Trades,fs,indent=2)
