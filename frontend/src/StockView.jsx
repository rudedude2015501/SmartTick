import React, { useState, useContext } from 'react';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';

import TradeChart from './Chart';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function StockView({ searchSymbol }) {
  const theme = useTheme(); // Access current theme
  const [profileData, setProfileData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [realtimePrice, setRealtimePrice] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState(null);

  // Effect to fetch data when searchSymbol changes
  React.useEffect(() => {
    const fetchData = async () => {
      if (!searchSymbol) return;
      
      // Reset states before fetching
      resetStates();

      try {
        // Fetch Profile Data
        const profileResponse = await fetch(`${apiUrl}/api/profile/${searchSymbol}`);
        if (!profileResponse.ok) {
          throw new Error(`Error: ${profileResponse.statusText}`);
        }
        const profileData = await profileResponse.json();
        setProfileData(profileData);

        // Fetch Real-Time Price
        const priceResponse = await fetch(`${apiUrl}/api/price/${searchSymbol}`);
        if (!priceResponse.ok) {
          throw new Error(`Error: ${priceResponse.statusText}`);
        }
        const priceData = await priceResponse.json();
        setRealtimePrice(priceData);
      } catch (err) {
        setProfileError(err.message);
      } finally {
        setIsLoadingProfile(false);
      }

      try {
        // Fetch Trade Summary Data
        const chartResponse = await fetch(`${apiUrl}/api/trades/summary/${searchSymbol}`);
        if (!chartResponse.ok) {
          throw new Error(`Error: ${chartResponse.statusText}`);
        }
        const chartData = await chartResponse.json();
        setChartData(chartData);
      } catch (err) {
        setChartError(err.message);
      } finally {
        setIsLoadingChart(false);
      }
    };

    fetchData();
  }, [searchSymbol]);

  // Reset states before fetching
  const resetStates = () => {
    setProfileData(null);
    setChartData([]);
    setRealtimePrice(null);
    setProfileError(null);
    setChartError(null);
    setIsLoadingProfile(true);
    setIsLoadingChart(true);
  };

  // Get appropriate link colors based on theme mode
  const getLinkColor = (state) => {
    if (theme.palette.mode === 'dark') {
      return {
        link: '#8ccdff', // Light blue color for links in dark mode
        visited: '#c5a3ff', // Light purple for visited links
        hover: '#aee0ff', // Lighter blue for hover state
      }[state] || '#8ccdff';
    }
    // Default colors for light mode
    return {
      link: '#1976d2', // Default MUI blue
      visited: '#6c2dc7', // Default visited color
      hover: '#0a4b8c', // Darker blue for hover
    }[state] || '#1976d2';
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
        <Card sx={{ 
          boxShadow: 3, 
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper, // Use theme background
        }}>
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
                    <Link 
                      href={profileData.weburl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{
                        color: getLinkColor('link'),
                        '&:visited': {
                          color: getLinkColor('visited'),
                        },
                        '&:hover': {
                          color: getLinkColor('hover'),
                        },
                      }}
                    >
                      {profileData.weburl}
                    </Link>
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
                      border: `1px solid ${theme.palette.divider}`, // Use theme divider color
                      borderRadius: 1,
                      backgroundColor: theme.palette.mode === 'dark' ? '#00' : 'transparent', // dark background for logos in dark mode
                    }}
                  />
                )}
                {realtimePrice && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    <strong>Real-Time Price:</strong> ${realtimePrice.c.toFixed(2)}{' '}
                    <span style={{ 
                      color: realtimePrice.d >= 0 
                        ? theme.palette.mode === 'dark' ? '#4caf50' : 'green' 
                        : theme.palette.mode === 'dark' ? '#f44336' : 'red' 
                    }}>
                      ({realtimePrice.d >= 0 ? '+' : ''}
                      {realtimePrice.d.toFixed(2)} / {realtimePrice.dp.toFixed(2)}%)
                      {realtimePrice.d >= 0 ? ' ↑' : ' ↓'} Today
                    </span>
                  </Typography>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Trade Chart Section */}
      <Box>
        <Card sx={{ 
          boxShadow: 3, 
          borderRadius: 2, 
          p: 2, 
          minHeight: 450,
          backgroundColor: theme.palette.background.paper, // Use theme background
        }}>
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
          {!isLoadingChart && chartData.length > 0 && (
            <TradeChart 
              data={chartData} 
              isDarkMode={theme.palette.mode === 'dark'} // Pass dark mode flag to chart
            />
          )}
        </Card>
      </Box>
    </Box>
  );
}

export default StockView;