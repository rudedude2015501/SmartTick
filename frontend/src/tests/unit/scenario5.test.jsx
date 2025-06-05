import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import HomeView from '../../HomeView';
import StockView from '../../StockView';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

ModuleRegistry.registerModules([AllCommunityModule]);

vi.stubGlobal('import.meta', {
  env: {
    VITE_API_URL: 'http://localhost:5000',
  },
});

vi.mock('../../Chart.jsx', () => ({
    default: ({ data }) => (
      <div data-testid="trade-chart">
        {data && data.length > 0 ? (
          <div>
            <span>Total Buys ($)</span>
            <span>Total Sells ($)</span>
            <span>Chart rendered with {data.length} data points</span>
          </div>
        ) : (
          <span>No trade data available to display</span>
        )}
      </div>
    )
  }));

  // mock data
const MOCK_SYMBOL = "AAPL";

const mockProfileData = { name: "Apple Inc.", ticker: MOCK_SYMBOL, finnhubIndustry: "Technology", marketCapitalization: 2800000000000, ipo: "1980-12-12", exchange: "NASDAQ", weburl: "http://apple.com", logo: "apple_logo.png" };
const mockPriceData = { c: 170.00, d: 1.00, dp: 0.59 };
const mockPoliticianSummaryChartData = [{ month_label: "2023-01", Buy: 10000, Sell: 5000 }];
const mockRecentPoliticianTradesData = [{ id: 'pt1', politician_name: 'Pol X', type: 'buy', traded: '2023-05-01', size: '10k', price: '160' }];

const mockHistoricalPriceData = {
  prices: Array(10).fill(null).map((_, i) => ({
    date: `2023-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    close: 160.00 + i, open: 159.00 + i, high: 161.00 + i, low: 158.00 + i, volume: 1000000 + (i*10000)
  }))
};

const mockFinancialsData = { ten_day_avg_volume: 50000000, fifty_two_wk_high: 190.00, pe_ttm: 28.5, roe_ttm: 150.0, eps_ttm: 6.00, rev_growth_ttm_yoy: 5.0, current_ratio_quarterly: 0.8 };

describe('Scenario 5 testing: Stock Information View', () => {
  let mockFetch;
  const user = userEvent.setup();

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockFetch.mockImplementation(async (url) => {
      const urlString = url.toString();
      if (urlString.includes(`/api/profile/${MOCK_SYMBOL}`)) return { ok: true, json: async () => mockProfileData };
      if (urlString.includes(`/api/price/${MOCK_SYMBOL}`)) return { ok: true, json: async () => mockPriceData };
      if (urlString.includes(`/api/trades/summary/${MOCK_SYMBOL}`)) return { ok: true, json: async () => mockPoliticianSummaryChartData };
      if (urlString.includes(`/api/trades/${MOCK_SYMBOL}`)) return { ok: true, json: async () => mockRecentPoliticianTradesData };
      if (urlString.includes(`/api/prices/${MOCK_SYMBOL}`)) return { ok: true, json: async () => mockHistoricalPriceData };
      if (urlString.includes(`/api/financials-compact/${MOCK_SYMBOL}`)) return { ok: true, json: async () => mockFinancialsData };
      
      if (urlString.includes('/api/trades')) return { ok: true, json: async () => [] };
      if (urlString.includes('/api/politicians/stats')) return { ok: true, json: async () => ({ count: 0, data: [] }) };
      if (urlString.includes('/api/stocks/popular')) return { ok: true, json: async () => ({ count: 0, stocks: [] }) };
      
      return { ok: false, status: 404, json: async () => ({ error: `Unhandled API call to ${urlString}` }), statusText: 'Not Found' };
    });
  });

  test('displays stock profile and accordion UI when a symbol is provided', async () => {
    render(<StockView searchSymbol={MOCK_SYMBOL} />);

    expect(await screen.findByText(`${mockProfileData.name} (${mockProfileData.ticker})`)).toBeInTheDocument();
    
    const industryLabel = await screen.findByText('Industry:');
    expect(industryLabel).toBeInTheDocument();
    expect(industryLabel.parentElement).toHaveTextContent(`Industry: ${mockProfileData.finnhubIndustry}`);

    const realTimePriceLabel = await screen.findByText('Real-Time Price:');
    expect(realTimePriceLabel).toBeInTheDocument();
    const expectedPriceString = mockPriceData.c.toFixed(2);
    const realTimePricePattern = new RegExp(`Real-Time Price:\\s*\\$${expectedPriceString.replace('.', '\\.')}`);
    expect(realTimePriceLabel.parentElement).toHaveTextContent(realTimePricePattern);

    expect(screen.getByRole('button', { name: /Stock Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Historical Price Chart/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Technical & Sentiment Analysis/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recent Politician Trades/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Politician Monthly Trade Summary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Financial Information Summary/i })).toBeInTheDocument();
  });

  test('allows expanding "Historical Price Chart" and shows chart content', async () => {
    render(<StockView searchSymbol={MOCK_SYMBOL} />);
    
    const historicalChartHeader = screen.getByRole('button', { name: /Historical Price Chart/i });
    await user.click(historicalChartHeader);

    expect(await screen.findByText(`Price Chart for ${MOCK_SYMBOL.toUpperCase()}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 month' })).toBeInTheDocument();
  });

  test('allows expanding "Technical & Sentiment Analysis" and shows analysis content', async () => {
    render(<StockView searchSymbol={MOCK_SYMBOL} />);
    
    const analysisHeader = screen.getByRole('button', { name: /Technical & Sentiment Analysis/i });
    await user.click(analysisHeader);

    expect(await screen.findByText(/Overall Analysis/i)).toBeInTheDocument();
  });

  test('allows expanding "Recent Politician Trades" and shows trades', async () => {
    render(<StockView searchSymbol={MOCK_SYMBOL} />);

    const recentTradesHeader = screen.getByRole('button', { name: /Recent Politician Trades/i });
    await user.click(recentTradesHeader);
    
    expect(await screen.findByRole('columnheader', { name: 'Politician' })).toBeInTheDocument(); 
    expect(screen.getByText(mockRecentPoliticianTradesData[0].politician_name)).toBeInTheDocument();
  });

  test('allows expanding "Politician Monthly Trade Summary" and shows summary', async () => {
    render(<StockView searchSymbol={MOCK_SYMBOL} />);

    const summaryHeader = screen.getByRole('button', { name: /Politician Monthly Trade Summary/i });
    await user.click(summaryHeader);
    
    expect(screen.queryByText(/No politician trade summary data found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No trade data available to display/i)).not.toBeInTheDocument(); 
    
    expect(await screen.findByTestId('trade-chart')).toBeInTheDocument();
    expect(await screen.findByText('Total Buys ($)')).toBeInTheDocument();
    expect(await screen.findByText('Total Sells ($)')).toBeInTheDocument();
    
    // checks for specific chart elements, i.e., the bars in the bar chart
    // const bars = container.querySelectorAll('rect'); // BarChart renders bars as rectangles
    // expect(bars.length).toBeGreaterThan(0);
  });

  test('allows expanding "Financial Information Summary" and shows financials', async () => {
    render(<StockView searchSymbol={MOCK_SYMBOL} />);
    
    const financialsHeader = screen.getByRole('button', { name: /Financial Information Summary/i });
    await user.click(financialsHeader);

    expect(await screen.findByText('Market Performance')).toBeInTheDocument();
    expect(screen.getByText('Valuation')).toBeInTheDocument();
    expect(screen.getByText('52-Week High')).toBeInTheDocument();
  });
});