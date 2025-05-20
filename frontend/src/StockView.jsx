import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import TradeChart from './Chart'; // For politician trade summary
import HistoricalPriceChart from './HistoricalPriceChart'; // For Tiingo stock price history

// Adding StockAnalysis.jsx, with analysis functionality
import StockAnalysis from './StockAnalysis';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function StockView({ searchSymbol }) {
  const theme = useTheme();
  const [profileData, setProfileData] = useState(null);
  const [politicianTradeChartData, setPoliticianTradeChartData] = useState([]);
  const [realtimePrice, setRealtimePrice] = useState(null);
  const [trades, setTrades] = useState([]);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const [isLoadingPoliticianChart, setIsLoadingPoliticianChart] = useState(false);
  const [politicianChartError, setPoliticianChartError] = useState(null);
  
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  const [tradesError, setTradesError] = useState(null);

  const [historicalPriceData, setHistoricalPriceData] = useState([]);
  const [isLoadingHistoricalPrices, setIsLoadingHistoricalPrices] = useState(false);
  const [historicalPriceError, setHistoricalPriceError] = useState(null);
  
  const [selectedRange, setSelectedRange] = useState('1Y'); // Default to 1 Year for historical prices

  // Effect to clear all data when searchSymbol becomes empty
  useEffect(() => {
    if (!searchSymbol) {
      setProfileData(null);
      setRealtimePrice(null);
      setPoliticianTradeChartData([]);
      setTrades([]);
      setHistoricalPriceData([]);

      setProfileError(null);
      setPoliticianChartError(null);
      setTradesError(null);
      setHistoricalPriceError(null);

      setIsLoadingProfile(false);
      setIsLoadingPoliticianChart(false);
      setIsLoadingTrades(false);
      setIsLoadingHistoricalPrices(false);
    }
  }, [searchSymbol]);

  // Effect for Profile, Politician Trades, Politician Chart (runs when searchSymbol changes AND is not empty)
  useEffect(() => {
    const fetchCoreData = async () => {
      setProfileData(null); 
      setRealtimePrice(null);
      setPoliticianTradeChartData([]);
      setTrades([]);

      setIsLoadingProfile(true);
      setProfileError(null);
      setIsLoadingPoliticianChart(true);
      setPoliticianChartError(null);
      setIsLoadingTrades(true);
      setTradesError(null);

      try {
        const profilePromise = fetch(`${apiUrl}/api/profile/${searchSymbol}`);
        const pricePromise = fetch(`${apiUrl}/api/price/${searchSymbol}`);
        const politicianChartPromise = fetch(`${apiUrl}/api/trades/summary/${searchSymbol}`);
        const tradesPromise = fetch(`${apiUrl}/api/trades/${searchSymbol}`);

        const [profileResponse, priceResponse, politicianChartResponseResolved, tradesResponseResolved] = await Promise.all([
            profilePromise, pricePromise, politicianChartPromise, tradesPromise
        ]);

        // Process Profile and Real-time Price
        if (!profileResponse.ok) throw new Error(`Profile Error: ${profileResponse.statusText} (${profileResponse.status})`);
        const pData = await profileResponse.json();
        setProfileData(pData);

        if (!priceResponse.ok) throw new Error(`Real-time Price Error: ${priceResponse.statusText} (${priceResponse.status})`);
        const priceD = await priceResponse.json();
        setRealtimePrice(priceD);
        setIsLoadingProfile(false); 

        // Process Politician Chart Data
        if (!politicianChartResponseResolved.ok) throw new Error(`Politician Trade Summary Error: ${politicianChartResponseResolved.statusText} (${politicianChartResponseResolved.status})`);
        const cData = await politicianChartResponseResolved.json();
        setPoliticianTradeChartData(cData);
        setIsLoadingPoliticianChart(false);
      
        // Process Recent Politician Trades Data
        if (!tradesResponseResolved.ok) throw new Error(`Recent Trades Error: ${tradesResponseResolved.statusText} (${tradesResponseResolved.status})`);
        const tData = await tradesResponseResolved.json();
        setTrades(tData);
        setIsLoadingTrades(false);

      } catch (err) {
        setProfileError(err.message); 
        setPoliticianChartError(err.message);
        setTradesError(err.message);
        setIsLoadingProfile(false);
        setIsLoadingPoliticianChart(false);
        setIsLoadingTrades(false);
      }
    };

    if (searchSymbol) {
      fetchCoreData();
    }
  }, [searchSymbol]);


  // Effect for Historical Stock Prices (Tiingo) - runs when searchSymbol OR selectedRange changes (and symbol is present)
  useEffect(() => {
    const fetchHistoricalPrices = async () => {
      setIsLoadingHistoricalPrices(true);
      setHistoricalPriceError(null);
      setHistoricalPriceData([]); 

      try {
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        let startDate;

        switch (selectedRange) {
            case '1M':
                startDate = new Date(new Date().setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
                break;
            case '6M':
                startDate = new Date(new Date().setMonth(today.getMonth() - 6)).toISOString().split('T')[0];
                break;
            case '1Y':
            default: // Default is now effectively 1M if 1Y is also removed or if selectedRange becomes invalid
                startDate = new Date(new Date().setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
                break;
        }
        
        const historicalResponse = await fetch(`${apiUrl}/api/prices/${searchSymbol}?start=${startDate}&end=${endDate}`);
        if (!historicalResponse.ok) {
            const errorData = await historicalResponse.json().catch(() => ({ message: `Historical Prices Error: ${historicalResponse.statusText} (${historicalResponse.status})` }));
            throw new Error(errorData.error || `Historical Prices Error: ${historicalResponse.statusText} (${historicalResponse.status})`);
        }
        const histPriceData = await historicalResponse.json();
        if (histPriceData.prices && histPriceData.prices.length > 0) {
            setHistoricalPriceData(histPriceData.prices);
        } else {
            setHistoricalPriceData([]); 
        }
      } catch (err) {
        setHistoricalPriceError(err.message);
        setHistoricalPriceData([]); 
      } finally {
        setIsLoadingHistoricalPrices(false);
      }
    };
    
    if (searchSymbol) {
      fetchHistoricalPrices();
    }
  }, [searchSymbol, selectedRange]);

  const handleRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setSelectedRange(newRange);
    }
  };

  const getLinkColor = (state) => {
    if (theme.palette.mode === 'dark') {
      return { link: '#8ccdff', visited: '#c5a3ff', hover: '#aee0ff' }[state] || '#8ccdff';
    }
    return { link: '#1976d2', visited: '#6c2dc7', hover: '#0a4b8c' }[state] || '#1976d2';
  };

  if (!searchSymbol) {
    return (
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 10 }}>
        Enter a stock symbol in the search bar above to view its profile and trade summary.
      </Typography>
    );
  }

  return (
    <Box>
      {/* Profile Section */}
      <Box mb={4}>
        <Card sx={{ boxShadow: 3, borderRadius: 2, backgroundColor: theme.palette.background.paper }}>
          <CardContent>
            {isLoadingProfile && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
            )}
            {profileError && <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>{profileError}</Alert>}
            {!isLoadingProfile && !profileError && !profileData && (
              <Typography sx={{ p: 2, color: 'text.secondary' }}>No profile data found.</Typography>
            )}
            {profileData && (
              <>
                <Typography variant="h6" component="div">{profileData.name} ({profileData.ticker})</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}><strong>Industry:</strong> {profileData.finnhubIndustry || 'N/A'}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Market Cap:</strong> ${profileData.marketCapitalization?.toLocaleString() || 'N/A'} Billion</Typography>
                <Typography variant="body2" color="text.secondary"><strong>IPO Date:</strong> {profileData.ipo || 'N/A'}</Typography>
                <Typography variant="body2" color="text.secondary"><strong>Exchange:</strong> {profileData.exchange || 'N/A'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Website:</strong>{' '}
                  {profileData.weburl ? (<Link href={profileData.weburl} target="_blank" rel="noopener noreferrer" sx={{ color: getLinkColor('link'), '&:visited': { color: getLinkColor('visited') }, '&:hover': { color: getLinkColor('hover') } }}>{profileData.weburl}</Link>) : ('N/A')}
                </Typography>
                {profileData.logo && (<CardMedia component="img" image={profileData.logo} alt={`${profileData.name} logo`} sx={{ maxWidth: 100, margin: '16px auto 0', padding: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, backgroundColor: theme.palette.mode === 'dark' ? '#000' : 'transparent' }} />)}
                {realtimePrice && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    <strong>Real-Time Price:</strong> ${realtimePrice.c?.toFixed(2)}{' '}
                    <span style={{ color: realtimePrice.d >= 0 ? (theme.palette.mode === 'dark' ? '#4caf50' : 'green') : (theme.palette.mode === 'dark' ? '#f44336' : 'red') }}>
                      ({realtimePrice.d >= 0 ? '+' : ''}{realtimePrice.d?.toFixed(2)} / {realtimePrice.dp?.toFixed(2)}%){realtimePrice.d >= 0 ? ' ↑' : ' ↓'} Today
                    </span>
                  </Typography>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Historical Price Chart Section (Tiingo Data) */}
      <Box mt={4} mb={4}>
        <Card sx={{ boxShadow: 3, borderRadius: 2, p: 2, backgroundColor: theme.palette.background.paper }}>
          <Typography variant="h6" gutterBottom component="div" sx={{ mb: 1, textAlign: 'center' }}>
            Historical Price Chart for {searchSymbol}
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={selectedRange}
              exclusive
              onChange={handleRangeChange}
              aria-label="historical price range"
              size="small"
            >
              {}
              <ToggleButton value="1M" aria-label="1 month">1M</ToggleButton>
              <ToggleButton value="6M" aria-label="6 months">6M</ToggleButton>
              <ToggleButton value="1Y" aria-label="1 year">1Y</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {isLoadingHistoricalPrices && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}><CircularProgress /></Box>
          )}
          {historicalPriceError && <Alert severity="warning" sx={{mt: 1, mb: 1}}>{historicalPriceError}</Alert>}
          {!isLoadingHistoricalPrices && !historicalPriceError && (
            <HistoricalPriceChart data={historicalPriceData} symbol={searchSymbol} />
          )}
        </Card>
      </Box>

      {/* Technical Analysis Section */}
      <Box mt={4}>
        {isLoadingHistoricalPrices || isLoadingTrades ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          historicalPriceData.length > 0 && trades.length > 0 ? (
            <StockAnalysis 
              symbol={searchSymbol} 
              historicalPriceData={historicalPriceData}
              trades={trades} 
            />
          ) : (
            <Alert severity="info">
              {historicalPriceData.length === 0 && trades.length === 0 ? 
                "Both historical price data and congressional trade data are required for technical analysis." :
                historicalPriceData.length === 0 ? 
                "Historical price data is missing. Unable to perform technical analysis." :
                "No congressional trade data available for sentiment analysis."}
            </Alert>
          )
        )}
      </Box>
      
      {/* Recent Politician Trades Section */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Recent Politician Trades for {searchSymbol}</Typography>
        {isLoadingTrades && (<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>)}
        {tradesError && <Alert severity="error">{tradesError}</Alert>}
        {!isLoadingTrades && trades.length === 0 && !tradesError && (<Typography sx={{ color: 'text.secondary', mt: 2 }}>No recent politician trades found for this stock.</Typography>)}
        {!isLoadingTrades && trades.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Politician</strong></TableCell>
                  <TableCell><strong>Trade Type</strong></TableCell>
                  <TableCell><strong>Trade Date</strong></TableCell>
                  <TableCell><strong>Size</strong></TableCell>
                  <TableCell><strong>Price</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{trade.politician_name || 'N/A'}</TableCell>
                    <TableCell>{trade.type ? trade.type.charAt(0).toUpperCase() + trade.type.slice(1) : 'N/A'}</TableCell>
                    <TableCell>{trade.traded ? new Intl.DateTimeFormat('en-US').format(new Date(trade.traded)) : 'N/A'}</TableCell>
                    <TableCell>{trade.size || 'N/A'}</TableCell>
                    <TableCell>{trade.price || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Politician Trade Summary Chart Section */}
      <Box mt={4}>
        <Card sx={{ boxShadow: 3, borderRadius: 2, p: 2, minHeight: 450, backgroundColor: theme.palette.background.paper }}>
           <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2, textAlign: 'center' }}>Politician Monthly Trade Summary</Typography>
          {isLoadingPoliticianChart && (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 300 }}><CircularProgress /></Box>)}
          {politicianChartError && <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>{politicianChartError}</Alert>}
          {!isLoadingPoliticianChart && !politicianChartError && politicianTradeChartData.length === 0 && (<Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center', mt: 4 }}>No politician trade summary data found for this period.</Typography>)}
          {!isLoadingPoliticianChart && politicianTradeChartData.length > 0 && (<TradeChart data={politicianTradeChartData} />)}
        </Card>
      </Box>
    </Box>
  );
}

export default StockView;