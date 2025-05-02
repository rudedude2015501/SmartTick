import React, { useState } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';

import TradeChart from './Chart';


// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Styled components
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

// Main App component
function App() {
  const [symbol, setSymbol] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);

  // Handle search function
  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmedSymbol = symbol.trim();
    if (!trimmedSymbol) return; // Don't search if input is empty

    setSearchSymbol(trimmedSymbol); // Store the searched symbol

    // Reset states before fetching
    resetStates();

    try {
      // Fetch Profile Data
      const profileResponse = await fetch(`${apiUrl}/api/profile/${trimmedSymbol}`);
      if (!profileResponse.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const profileData = await profileResponse.json();
      setProfileData(profileData);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsLoadingProfile(false);
    }

    try {
      // Fetch Trade Summary Data
      const chartResponse = await fetch(`${apiUrl}/api/trades/summary/${trimmedSymbol}`);
      if (!chartResponse.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const chartData = await chartResponse.json();
      setChartData(chartData);
    } catch (err) {
      setChartError(err.message);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // Reset states before fetching
  const resetStates = () => {
    setProfileData(null);
    setChartData([]);
    setProfileError(null);
    setChartError(null);
    setIsLoadingProfile(true);
    setIsLoadingChart(true);
  };

  return (
    <>
      <AppBar position="fixed">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap>
            SmartTick
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch(e);
              }}
            />
          </Search>
        </Toolbar>
      </AppBar>

      {/* Offset content below fixed AppBar */}
      <Toolbar />

      <Box sx={{ backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 64px)', py: 4, px: 2 }}>
        <Container maxWidth="md">
          {searchSymbol ? (
            <Box>
              {/* Profile Section */}
              <Box mb={4}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                  Stock Profile: {searchSymbol}
                </Typography>
                <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                  <CardContent>
                    {isLoadingProfile && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                      </Box>
                    )}
                    {profileError && <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>{profileError}</Alert>}
                    {!isLoadingProfile && !profileError && !profileData && (
                      <Typography sx={{ p: 2, color: 'text.secondary' }}>No profile data found.</Typography>
                    )}
                    {profileData && (
                      <>
                        <Typography variant="h6" component="div">
                          {profileData.name} ({profileData.ticker})
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          <strong>Industry:</strong> {profileData.finnhubIndustry || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Market Cap:</strong> $
                          {profileData.marketCapitalization?.toLocaleString() || 'N/A'} Billion
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
                          ) : (
                            'N/A'
                          )}
                        </Typography>
                        {profileData.logo && (
                          <CardMedia
                            component="img"
                            image={profileData.logo}
                            alt={`${profileData.name} logo`}
                            sx={{
                              maxWidth: 100,
                              margin: '16px auto 0',
                              padding: 1,
                              border: '1px solid #eee',
                              borderRadius: 1,
                            }}
                          />
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Box>

              {/* Trade Chart Section */}
              <Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
                  Monthly Trade Summary: {searchSymbol}
                </Typography>
                <Card sx={{ boxShadow: 3, borderRadius: 2, p: 2, minHeight: 450 }}>
                  {isLoadingChart && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 300 }}>
                      <CircularProgress />
                    </Box>
                  )}
                  {chartError && <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>{chartError}</Alert>}
                  {!isLoadingChart && !chartError && chartData.length === 0 && (
                    <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center', mt: 4 }}>
                      No trade summary data found for this period.
                    </Typography>
                  )}
                  {!isLoadingChart && chartData.length > 0 && <TradeChart data={chartData} />}
                </Card>
              </Box>
            </Box>
          ) : (
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
