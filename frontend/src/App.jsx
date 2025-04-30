// SmartTick/frontend/src/App.jsx
// Merged Material UI version with Trade Summary Chart functionality
// Chart is now displayed below the profile information.

import React, { useState, useCallback } from 'react';

// --- Material UI Imports ---
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import InputBase from '@mui/material/InputBase';
import { alpha, styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import CircularProgress from '@mui/material/CircularProgress'; // For loading indicator
import Grid from '@mui/material/Grid'; // Still useful for potential inner layouts or spacing

// --- Chart Imports ---
import TradeChart from './Chart'; // Import the chart component
// Assuming Chart.jsx handles its own internal styling and doesn't need App.css
// If App.css was used for MUI styling, keep it, otherwise remove:
// import './App.css';

// Get API URL from environment variable (set by Docker/Vite)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// --- Styled components from original Material UI version ---
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));
// --- End Styled Components ---

function App() {
  // --- Combined State ---
  const [symbol, setSymbol] = useState(''); // User input for stock symbol
  const [searchSymbol, setSearchSymbol] = useState(''); // Symbol used in the last search

  // Profile Data State
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Chart Data State
  const [chartData, setChartData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);


  // --- Combined Search Handler ---
  const handleSearch = useCallback(async (event) => {
    // Allow triggering via event (like Enter key) or directly
    if (event && event.preventDefault) {
        event.preventDefault();
    }

    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol) return; // Don't search if empty

    setSearchSymbol(trimmedSymbol); // Store the searched symbol

    // Reset states before fetching
    setProfileData(null);
    setChartData([]);
    setProfileError(null);
    setChartError(null);
    setIsLoadingProfile(true);
    setIsLoadingChart(true);

    // --- Fetch Profile Data ---
    try {
      console.log(`Fetching profile for symbol: ${trimmedSymbol} from ${apiUrl}/api/profile/${trimmedSymbol}`);
      const profileResponse = await fetch(`${apiUrl}/api/profile/${trimmedSymbol}`);
      if (!profileResponse.ok) {
         let errorMsg = `Profile Error: ${profileResponse.status} ${profileResponse.statusText}`;
         try {
            const errData = await profileResponse.json();
            errorMsg = errData.error || errData.message || errorMsg; // Use backend error if available
         } catch (jsonError) { /* Ignore if response not JSON */ }
         throw new Error(errorMsg);
      }
      const data = await profileResponse.json();
      console.log("Received profile data:", data);
      setProfileData(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfileError(err.message || 'Failed to fetch profile data.');
    } finally {
      setIsLoadingProfile(false);
    }

    // --- Fetch Trade Summary Data ---
    try {
      console.log(`Fetching trade summary for symbol: ${trimmedSymbol} from ${apiUrl}/api/trades/summary/${trimmedSymbol}`);
      const chartResponse = await fetch(`${apiUrl}/api/trades/summary/${trimmedSymbol}`);
      if (!chartResponse.ok) {
        let errorMsg = `Trade Summary Error: ${chartResponse.status} ${chartResponse.statusText}`;
        try {
            const errData = await chartResponse.json();
            errorMsg = errData.error || errorMsg;
        } catch (jsonError) { /* Ignore */ }
        throw new Error(errorMsg);
      }
      const data = await chartResponse.json();
      console.log("Received chart data:", data);
      setChartData(data);
    } catch (err) {
      console.error("Failed to fetch trade summary:", err);
      setChartError(err.message || 'Failed to fetch trade summary data.');
      setChartData([]); // Ensure chart is cleared on error
    } finally {
      setIsLoadingChart(false);
    }
  }, [symbol, apiUrl]); // Dependencies for useCallback


  return (
    <>
      {/* AppBar with Search (from original MUI version) */}
      <AppBar position="fixed" sx={{ backgroundColor: '#1976d2' }}> {/* Use fixed position */}
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div"> {/* Added component="div" */}
            SmartTick
          </Typography>
          {/* Use form for semantic correctness and accessibility */}
          <form onSubmit={handleSearch}>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search Stock…"
                inputProps={{ 'aria-label': 'search stock symbol' }} // More descriptive label
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                // Removed onKeyDown, search is triggered by form onSubmit (Enter key) or implicitly if needed
              />
            </Search>
            {/* Hidden submit button for accessibility, or rely on Enter key */}
             <button type="submit" style={{ display: 'none' }} aria-hidden="true">Search</button>
          </form>
        </Toolbar>
      </AppBar>
      {/* Add Toolbar component to offset content below fixed AppBar */}
      <Toolbar />

      {/* Main Content Area */}
      <Box sx={{ backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)', py: 4, px: 2 }}> {/* Adjust minHeight for AppBar */}
        {/* Use a simpler container, items will stack vertically by default */}
        <Container maxWidth="md"> {/* Adjusted maxWidth for single column */}
          {/* Show loading/errors/content only after a search has been initiated */}
          {searchSymbol && (
            // Use Box or React.Fragment instead of Grid container if just stacking
            <Box>
              {/* --- Profile Section --- */}
              <Box mb={4}> {/* Add margin below profile section */}
                 <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                   Stock Profile: {searchSymbol}
                 </Typography>
                 <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                    <CardContent>
                        {isLoadingProfile && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>}
                        {profileError && <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>{profileError}</Alert>}
                        {!isLoadingProfile && !profileError && !profileData && <Typography sx={{ p: 2, color: 'text.secondary' }}>No profile data found.</Typography>}
                        {profileData && (
                        <>
                            <Typography variant="h6" component="div">
                            {profileData.name} ({profileData.ticker})
                            </Typography>
                            {/* Display other profile details */}
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                <strong>Industry:</strong> {profileData.finnhubIndustry || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Market Cap:</strong> ${profileData.marketCapitalization ? profileData.marketCapitalization.toLocaleString() : 'N/A'} Billion
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>IPO Date:</strong> {profileData.ipo || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Exchange:</strong> {profileData.exchange || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Website:</strong>{' '}
                                {profileData.weburl ? (
                                    <a href={profileData.weburl} target="_blank" rel="noopener noreferrer">
                                    {profileData.weburl}
                                    </a>
                                ) : 'N/A'}
                            </Typography>
                            {profileData.logo && (
                                <CardMedia
                                    component="img"
                                    image={profileData.logo}
                                    alt={`${profileData.name} logo`}
                                    sx={{ maxWidth: 100, margin: '16px auto 0', padding: 1, border: '1px solid #eee', borderRadius: 1 }}
                                />
                            )}
                        </>
                        )}
                    </CardContent>
                 </Card>
              </Box> {/* End Profile Section Box */}

              {/* --- Trade Chart Section --- */}
              <Box> {/* Chart Section Box */}
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                  Monthly Trade Summary: {searchSymbol}
                </Typography>
                 <Card sx={{ boxShadow: 3, borderRadius: 2, p: 2, minHeight: 450 }}> {/* Ensure card has height */}
                    {isLoadingChart && <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 300 }}><CircularProgress /></Box>}
                    {chartError && <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>{chartError}</Alert>}
                    {!isLoadingChart && !chartError && chartData.length === 0 && <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center', mt: 4 }}>No trade summary data found for this period.</Typography>}
                    {!isLoadingChart && chartData.length > 0 && (
                         <TradeChart data={chartData} />
                    )}
                 </Card>
              </Box> {/* End Chart Section Box */}
            </Box> // End Main Content Box
          )}

          {/* Initial message before search */}
          {!searchSymbol && (
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 10 }}>
                Enter a stock symbol in the search bar above to view its profile and trade summary.
            </Typography>
          )}
        </Container>
      </Box>
    </>
  );
}

export default App;
