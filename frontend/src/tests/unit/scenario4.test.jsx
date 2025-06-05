import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import HomeView from '../../HomeView'; 
import CongressView from '../../CongressView'; 
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

vi.stubGlobal('import.meta', {
  env: {
    VITE_API_URL: 'http://localhost:5000',
  },
});

const mockTradesForScenario4 = [
  {
    id: 't1',
    politician_name: 'Nancy Pelosi',
    img: 'http://example.com/nancy.jpg', // mock image url 
    traded_issuer_ticker: 'AAPL',
    type: 'buy',
    traded: '2023-01-01',
    size: '1k',
    price: '100'
  },
];

// mock data
const mockPolImageResponse = {
  img: 'http://example.com/nancy_profile_congress.jpg', 
  politician_name: 'Nancy Pelosi',
  politician_family: 'Pelosi Family Office',
};
const mockLatestTradeResponse = {
  id: 'lt1', traded_issuer_ticker: 'MSFT', type: 'sell', traded: '2023-03-01', size: '$1k - $15k'
};
const mockBiggestTradeResponse = {
  id: 'bt1', traded_issuer_ticker: 'GOOG', type: 'buy', traded: '2023-02-15', size: '$100k - $250k'
};
const mockPolStatsResponse = {
  total_trades: 150,
  estimated_spending: 5000000,
};


describe('Scenario 4 testing: Displaying Politician Profile', () => {
  let mockFetch;
  const user = userEvent.setup();

  beforeEach(() => { 
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    mockFetch.mockImplementation(async (url) => {
      const urlString = url.toString();
      if (urlString.includes('/api/trades')) { 
        return { ok: true, json: async () => mockTradesForScenario4 };
      }
      if (urlString.includes('/api/politicians/stats')) {
        return { ok: true, json: async () => ({ count: 0, data: [] }) };
      }
      if (urlString.includes('/api/stocks/popular')) {
        return { ok: true, json: async () => ({ count: 0, stocks: [] }) };
      }
      if (urlString.includes(`/api/pol/image?name=${encodeURIComponent('Nancy Pelosi')}`)) {
        return { ok: true, json: async () => mockPolImageResponse };
      }
      if (urlString.includes(`/api/politicians/${encodeURIComponent('Nancy Pelosi')}/latest-trade`)) {
        return { ok: true, json: async () => mockLatestTradeResponse };
      }
      if (urlString.includes(`/api/politicians/${encodeURIComponent('Nancy Pelosi')}/biggest-trade`)) {
        return { ok: true, json: async () => mockBiggestTradeResponse };
      }
      if (urlString.includes(`/api/politicians/${encodeURIComponent('Nancy Pelosi')}/stats`)) {
        return { ok: true, json: async () => mockPolStatsResponse };
      }
      return { ok: false, status: 404, json: async () => ({ error: `Unhandled API call to ${urlString}` }), statusText: 'Not Found' };
    });
  });

  test('HomeView: displays politician name and picture in trades, and click calls handler', async () => {
    const handlePoliticianClick = vi.fn();
    render(<HomeView onPoliticianClick={handlePoliticianClick} />);

    // user should see the name and picture of politicians in the recent trades table
    const politicianNameCell = await screen.findByText('Nancy Pelosi');
    expect(politicianNameCell).toBeInTheDocument();

    // the image is within the same row 
    const clickablePoliticianArea = politicianNameCell.closest('[role="button"]');
    expect(clickablePoliticianArea).toBeInTheDocument();
    expect(clickablePoliticianArea).toHaveAttribute('aria-label', 'View Nancy Pelosi in Congress view');

    // check for the image within this clickable area
    const politicianImage = within(clickablePoliticianArea).getByRole('img', { name: 'Nancy Pelosi' });
    expect(politicianImage).toBeInTheDocument();
    expect(politicianImage).toHaveAttribute('src', 'http://example.com/nancy.jpg');

    // user can click on either the name or picture of the politician
    await user.click(clickablePoliticianArea);

    // that then takes you to “Congress” view 
    expect(handlePoliticianClick).toHaveBeenCalledTimes(1);
    expect(handlePoliticianClick).toHaveBeenCalledWith('Nancy Pelosi');
  });

  test('CongressView: displays relevant information for a searched politician', async () => {
    // mocks for Nancy Pelosi are set up in beforeEach
    render(<CongressView searchTerm="Nancy Pelosi" />);

    // user should see relevant information about a politician
    expect(await screen.findByText(mockPolImageResponse.politician_name)).toBeInTheDocument();
    // Check for family name/details (if provided)
    expect(screen.getByText(mockPolImageResponse.politician_family)).toBeInTheDocument();

    // check for profile image 
    const profileImage = screen.getByRole('img'); 
    expect(profileImage).toHaveAttribute('src', mockPolImageResponse.img);

    // check for latest trade info 
    expect(await screen.findByText(mockLatestTradeResponse.traded_issuer_ticker)).toBeInTheDocument();
    // check for biggest trade info
    expect(screen.getByText(mockBiggestTradeResponse.traded_issuer_ticker)).toBeInTheDocument();
  });
});