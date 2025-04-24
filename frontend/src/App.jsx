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

function App() {
  const [symbol, setSymbol] = useState(''); // User input for stock symbol
  const [profileData, setProfileData] = useState(null); // Fetched stock profile data
  const [error, setError] = useState(null); // Error message

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setProfileData(null);

    try {
      const response = await fetch(`http://localhost:5000/api/profile/${symbol}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {/* AppBar with Search */}
      <AppBar sx={{ backgroundColor: '#1976d2' }}>
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
      <Toolbar />
      <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        {profileData || error ? (
          <Container maxWidth="sm" sx={{ backgroundColor: '#ffffff', borderRadius: 2, p: 3, boxShadow: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Stock Profile
            </Typography>

            {/* Error Message */}
            {error && <Alert severity="error">{error}</Alert>}

            {/* Stock Profile Data */}
            {profileData && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h5">
                    {profileData.name} ({profileData.ticker})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Industry:</strong> {profileData.finnhubIndustry}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Market Capitalization:</strong> ${profileData.marketCapitalization} Billion
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>IPO Date:</strong> {profileData.ipo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Exchange:</strong> {profileData.exchange}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Website:</strong>{' '}
                    <a href={profileData.weburl} target="_blank" rel="noopener noreferrer">
                      {profileData.weburl}
                    </a>
                  </Typography>
                </CardContent>
                {profileData.logo && (
                  <CardMedia
                    component="img"
                    image={profileData.logo}
                    alt={`${profileData.name} logo`}
                    sx={{ maxWidth: 150, margin: '0 auto', padding: 2 }}
                  />
                )}
              </Card>
            )}
          </Container>
        ) : null}
      </Box>
    </>
  );
}

export default App;