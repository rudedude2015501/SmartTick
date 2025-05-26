from tiingo import TiingoClient

# make sure to set your Tiingo API key in .env
client = TiingoClient()

# date format: YYYY-MM-DD
def get_daily_prices(symbol, start, end):
    return client.get_ticker_price(
        symbol,
        fmt='json',
        startDate=start,
        endDate=end,
        frequency='daily'
    )

# sample

# print(get_daily_prices('AAPL', start='2024-06-05', end='2024-06-05'))

"""[{
    'date': '2024-12-31T00:00:00.000Z', 
    'close': 250.42, 
    'high': 253.28, 
    'low': 249.43, 
    'open': 252.44, 
    'volume': 39480718, 
    'adjClose': 250.1452961825, 
    'adjHigh': 253.0021588416, 
    'adjLow': 249.1563821852, 
    'adjOpen': 252.1630802984, 
    'adjVolume': 39480718, 
    'divCash': 0.0, 
    'splitFactor': 1.0
}]
"""