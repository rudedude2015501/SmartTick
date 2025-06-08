import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import HomeView from '../../HomeView'; 
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// mock env variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_API_URL: 'http://localhost:5000',
  },
});

// mock data
const mockEmptyTradesDataForLeaderboardTest = []; 

const mockPoliticianApiResults = [
  { name: 'Senator Alpha', party: 'Ind', total_trades: 25, estimated_spending: 75000 },
];
const mockPoliticianStatsResponse = {
  count: mockPoliticianApiResults.length,
  data: mockPoliticianApiResults, 
};

const mockStockApiResults = [
  { name: 'TechCorp', symbol: 'TCORP', trade_count: 150, buy_ratio: 65 },
];
const mockPopularStocksResponse = {
  count: mockStockApiResults.length,
  stocks: mockStockApiResults, 
};

describe('Scenario 3 testing: Home View Leaderboards', () => {
  let mockFetch;

  beforeAll(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url) => {
      const urlString = url.toString();
      if (urlString.includes('/api/trades')) {
        return { ok: true, json: async () => mockEmptyTradesDataForLeaderboardTest };
      }
      if (urlString.includes('/api/politicians/stats')) {
        return { ok: true, json: async () => mockPoliticianStatsResponse };
      }
      if (urlString.includes('/api/stocks/popular')) {
        return { ok: true, json: async () => mockPopularStocksResponse };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: `Unhandled API call to ${urlString}` }),
        statusText: 'Not Found'
      };
    });
  });

  test('User should see and be able to interact with both leaderboards', async () => {
    render(<HomeView onPoliticianClick={vi.fn()} />);

    // verify leader board titles  
    expect(await screen.findByText('Metric Leaderboards')).toBeInTheDocument();

    // verify politician leaderboard
    const politicianTitleElement = await screen.findByText('Politician Leaderboard');
    expect(politicianTitleElement).toBeInTheDocument();

    const politicianLeaderboardContainer = politicianTitleElement.closest('.MuiPaper-root');
    expect(politicianLeaderboardContainer).toBeInTheDocument();

    const politicianGrid = within(politicianLeaderboardContainer).getByRole('grid');
    expect(politicianGrid).toBeInTheDocument();

    // check for politician leader board header
    expect(within(politicianGrid).getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();

    // check for mock data
    expect(within(politicianGrid).getByText('Senator Alpha')).toBeInTheDocument();
    expect(within(politicianGrid).getByText('Ind')).toBeInTheDocument(); 



    // verify stock leaderboard
    const stockTitleElement = await screen.findByText('Stock Leaderboard');
    expect(stockTitleElement).toBeInTheDocument();

    const stockLeaderboardContainer = stockTitleElement.closest('.MuiPaper-root');
    expect(stockLeaderboardContainer).toBeInTheDocument();
    
    const stockGrid = within(stockLeaderboardContainer).getByRole('grid');
    expect(stockGrid).toBeInTheDocument();

    expect(within(stockGrid).getByRole('columnheader', { name: 'Symbol' })).toBeInTheDocument();

    // Check for mock data
    expect(within(stockGrid).getByText('TechCorp')).toBeInTheDocument();
    expect(within(stockGrid).getByText('TCORP')).toBeInTheDocument(); 
  });
});