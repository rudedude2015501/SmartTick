import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import HomeView from '../../HomeView'; 
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// mock env variable
vi.stubGlobal('import.meta', {
  env: {
    VITE_API_URL: 'http://localhost:5000',
  },
});

// mock data for testing
const mockTradesData = [
  {
    id: 'trade1', 
    politician_name: 'Nancy Pelosi',
    img: 'url_to_nancy_pelosi_img.jpg',
    traded_issuer_ticker: 'AAPL',
    type: 'buy',
    traded: '2023-05-10',
    size: '10k - 50k',
    price: '$150.00',
  },
];

const mockPoliticianStats = {
  count: 0,
  data: [],
};

const mockPopularStocks = {
  count: 0,
  stocks: [],
};

describe('Scenario 1 testing: Recent Politician Trades Table', () => {
  const mockFetch = vi.fn();
  
  beforeAll(() => {
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url) => {
      const urlString = url.toString();
      if (urlString.includes('/api/trades')) {
        return { ok: true, json: async () => mockTradesData };
      }
      if (urlString.includes('/api/politicians/stats')) {
        return { ok: true, json: async () => mockPoliticianStats };
      }
      if (urlString.includes('/api/stocks/popular')) {
        return { ok: true, json: async () => mockPopularStocks };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: `Unhandled API call to ${urlString}` }),
        statusText: 'Not Found'
      };
    });
  });

  test('Table for recent politician trades is visible and the user can interact with the table', async () => {
    const mockOnPoliticianClick = vi.fn();
    render(<HomeView onPoliticianClick={mockOnPoliticianClick} />);

    // check for the "Recent Trades" heading
    expect(await screen.findByText('Recent Trades')).toBeInTheDocument();

    // Wait for a key column header. This header is unique to the recent trades AG Grid.
    const politicianHeader = await screen.findByRole('columnheader', { name: 'Politician' });
    expect(politicianHeader).toBeInTheDocument();

    // check for at least one piece of trade data from the mock set
    expect(await screen.findByText('Nancy Pelosi')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();

    // find the specific grid container for the recent trades table.
    const tradesGridElement = politicianHeader.closest('[role="grid"]');
    
    // ensure the specific grid element was found 
    expect(tradesGridElement).toBeInTheDocument(); 
    expect(tradesGridElement).toHaveAttribute('role', 'grid');
  });
});