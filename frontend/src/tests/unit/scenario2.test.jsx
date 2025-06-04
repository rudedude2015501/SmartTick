import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; 
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

// mock data 
const mockTradesForFilter = [
    { id: 't1', politician_name: 'Nancy Pelosi', traded_issuer_ticker: 'AAPL', type: 'buy', traded: '2023-01-01', size: '1k', price: '100' },
    { id: 't2', politician_name: 'Daniel Goldman', traded_issuer_ticker: 'MSFT', type: 'sell', traded: '2023-01-02', size: '2k', price: '200' },
    { id: 't3', politician_name: 'Nancy Pelosi', traded_issuer_ticker: 'GOOG', type: 'buy', traded: '2023-01-03', size: '3k', price: '300' },
];

const mockPoliticiansForFilterApi = [
    { name: 'Pol A (Low Spending)', party: 'Dem', total_trades: 10, estimated_spending: 10000 },
    { name: 'Pol B (High Trades)', party: 'Rep', total_trades: 20, estimated_spending: 5000 },
    { name: 'Pol C (High Spending)', party: 'Ind', total_trades: 5,  estimated_spending: 60000 },
];
const mockPoliticianStatsResponseForFilter = { count: mockPoliticiansForFilterApi.length, data: mockPoliticiansForFilterApi };

const mockStocksForFilterApi = [
    { name: 'Stock X (High Trade Count)', symbol: 'STX', trade_count: 200, buy_ratio: 50 },
    { name: 'Stock Y (Mid Trade Count)', symbol: 'STY', trade_count: 100, buy_ratio: 70 },
    { name: 'Stock Z (Low Trade Count)', symbol: 'STZ', trade_count: 50,  buy_ratio: 60 },
];
const mockPopularStocksResponseForFilter = { count: mockStocksForFilterApi.length, stocks: mockStocksForFilterApi };

describe('Scenario 2 testing: Filtering', () => {
  let mockFetch;
  const user = userEvent.setup();

  beforeAll(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url) => {
      const urlString = url.toString();
      if (urlString.includes('/api/trades')) {
        return { ok: true, json: async () => mockTradesForFilter };
      }
      if (urlString.includes('/api/politicians/stats')) {
        return { ok: true, json: async () => mockPoliticianStatsResponseForFilter };
      }
      if (urlString.includes('/api/stocks/popular')) {
        return { ok: true, json: async () => mockPopularStocksResponseForFilter };
      }
      return { ok: false, status: 404, json: async () => ({ error: `Unhandled API call to ${urlString}` }), statusText: 'Not Found' };
    });
  });

  // test recent trades filtering 
  test('Recent Trades table allows opening column filter options', async () => {
    render(<HomeView onPoliticianClick={vi.fn()} />);

    const politicianHeader = await screen.findByRole('columnheader', { name: 'Politician' });
    expect(politicianHeader).toBeInTheDocument();

    const filterButtonContainer = politicianHeader.querySelector('.ag-header-cell-filter-button');
    expect(filterButtonContainer).toBeInTheDocument();

    await user.click(filterButtonContainer);

    expect(await screen.findByText('Contains')).toBeInTheDocument();

    const filterInputField = await screen.findByPlaceholderText('Filter...');
    expect(filterInputField).toBeInTheDocument();
    
    expect(filterInputField).toHaveRole('textbox');
  });

  // test politician leaderboard filtering 
  test('Politician Leaderboard allows filtering by metric', async () => {
    render(<HomeView onPoliticianClick={vi.fn()} />);

    const politicianTitleElement = await screen.findByText('Politician Leaderboard');
    const politicianLeaderboardContainer = politicianTitleElement.closest('.MuiPaper-root');
    expect(politicianLeaderboardContainer).toBeInTheDocument();

    const politicianGrid = within(politicianLeaderboardContainer).getByRole('grid');

    let metricColumnHeader = within(politicianGrid).getByRole('columnheader', { name: 'Total Trades' });
    expect(metricColumnHeader).toBeInTheDocument();
    expect(await within(politicianGrid).findByText('Pol B (High Trades)')).toBeInTheDocument();

    const metricDropdown = within(politicianLeaderboardContainer).getByRole('combobox', { name: 'Metric' });
    await user.click(metricDropdown);

    const listbox = await screen.findByRole('listbox');
    const estimatedSpendingOption = within(listbox).getByRole('option', { name: /Estimated Spending/i });
    await user.click(estimatedSpendingOption);

    metricColumnHeader = await within(politicianGrid).findByRole('columnheader', { name: 'Estimated Spending' });
    expect(metricColumnHeader).toBeInTheDocument();

    expect(await within(politicianGrid).findByText('Pol C (High Spending)')).toBeInTheDocument();
    const polCRow = await within(politicianGrid).findByText('Pol C (High Spending)');
    const polCRowElement = polCRow.closest('[role="row"]');
    expect(within(polCRowElement).getByText('60000')).toBeInTheDocument();
  });

  // test stock leaderboard filtering 
  test('Stock Leaderboard allows filtering by metric', async () => {
    render(<HomeView onPoliticianClick={vi.fn()} />);

    const stockTitleElement = await screen.findByText('Stock Leaderboard');
    const stockLeaderboardContainer = stockTitleElement.closest('.MuiPaper-root');
    expect(stockLeaderboardContainer).toBeInTheDocument();

    const stockGrid = within(stockLeaderboardContainer).getByRole('grid');

    let metricColumnHeader = within(stockGrid).getByRole('columnheader', { name: 'Trade Count' });
    expect(metricColumnHeader).toBeInTheDocument();
    expect(await within(stockGrid).findByText('Stock X (High Trade Count)')).toBeInTheDocument();

    const metricDropdown = within(stockLeaderboardContainer).getByRole('combobox', { name: 'Metric' });
    await user.click(metricDropdown);

    const listbox = await screen.findByRole('listbox');
    const buyPercentageOption = within(listbox).getByRole('option', { name: /Buy %/i });
    await user.click(buyPercentageOption);

    metricColumnHeader = await within(stockGrid).findByRole('columnheader', { name: 'Buy %' });
    expect(metricColumnHeader).toBeInTheDocument();

    expect(await within(stockGrid).findByText('Stock Y (Mid Trade Count)')).toBeInTheDocument();
    const stockYRow = await within(stockGrid).findByText('Stock Y (Mid Trade Count)');
    const stockYRowElement = stockYRow.closest('[role="row"]');
    expect(within(stockYRowElement).getByText('70')).toBeInTheDocument();
  });
});