import json 

def test_autocomplete_stocks(client):
    """
    test stock view autocomplete 
    """
    response = client.get('/api/autocomplete/stocks?query=AAP')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert len(data) >= 1  # Should find at least one match
    
    # Find AAPL in the results if it exists
    aapl_found = any(stock['symbol'] == 'AAPL' for stock in data if 'symbol' in stock)
    if aapl_found:
        aapl_stock = next(stock for stock in data if stock.get('symbol') == 'AAPL')
        assert aapl_stock['name'] == 'Apple Inc'