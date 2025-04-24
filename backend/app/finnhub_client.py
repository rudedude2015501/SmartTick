import os
import finnhub
import websocket

# put your finnhub API key into .env file
API_KEY = os.getenv("FINNHUB_API_KEY")
if not API_KEY:
    raise ValueError("FINNHUB_API_KEY is not set in the environment variables.")

# Setup client
finnhub_client = finnhub.Client(api_key=API_KEY)

# example company information (company_profile2 method)
"""
{'country': 'US', 
'currency': 'USD', 
'estimateCurrency': 'USD', 
'exchange': 'NASDAQ NMS - GLOBAL MARKET', 
'finnhubIndustry': 'Technology', 
'ipo': '1980-12-12', 
'logo': 'https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/AAPL.png', 
'marketCapitalization': 2959047.923065, 
'name': 'Apple Inc', 
'phone': '14089961010', 
'shareOutstanding': 15037.87, 
'ticker': 'AAPL', 
'weburl': 'https://www.apple.com/'}
"""

# Get company profile information
# - Includes basic company info, market capitalization, and shares outstanding.
# - Recommended: call once per day to keep market cap and share data updated.
# - Params:
#     symbol (str): Company ticker symbol (e.g. "AAPL")
def get_profile(symbol):
    return finnhub_client.company_profile2(symbol=symbol)


# Get current stock quote (real-time price data)
# - Includes current price, open, high, low, previous close, and timestamp.
# - Best used for quick snapshot; use WebSocket for live streaming.
# - Params:
#     symbol (str): Company ticker symbol (e.g. "AAPL")
def get_quote_data(symbol):
    return finnhub_client.quote(symbol)


# Get basic financial metrics for a company
# - Includes key ratios, balance sheet figures, income, and cash flow data.
# - Useful for fundamental analysis and valuation.
# - Params:
#     symbol (str): Company ticker symbol (e.g. "AAPL")
def get_financials(symbol):
    return finnhub_client.company_basic_financials(symbol, 'all')


# Get insider transactions for a company or market-wide
# - Can return a specific company's insider trades within a date range,
#   or leave `symbol` blank to get the latest transactions across the market.
# - Params:
#     f (str): Start date in format 'YYYY-MM-DD'
#     t (str): End date in format 'YYYY-MM-DD'
#     symbol (str, optional): Company ticker symbol (e.g. "AAPL")
def get_insider_transactions(f, t, symbol=''):
    return finnhub_client.stock_insider_transactions(symbol=symbol, from_=f, to=t)


def on_message(ws, message):
    print(message)

def on_error(ws, error):
    print(error)

def on_close(ws):
    print("### closed ###")

def on_open(ws):
    # multiple requests
    # for s in symbols:
    #     ws.send('{"type":"subscribe","symbol":' + f'"{s}"' + '}')

    # example request
    ws.send('{"type":"subscribe","symbol":"AAPL"}')

if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp(f"wss://ws.finnhub.io?token={API_KEY}",
                              on_message = on_message,
                              on_error = on_error,
                              on_close = on_close)
    ws.on_open = on_open

    # exit after processing the current message
    # ws.keep_running = False

    ws.run_forever()


