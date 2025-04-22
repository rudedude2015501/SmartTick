import React, { useState } from 'react';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

function App() {
  const [symbol, setSymbol] = useState(''); // State to store the user input
  const [profileData, setProfileData] = useState(null); // State to store the fetched data
  const [error, setError] = useState(null); // State to store any errors

  // Function to handle form submission
  const handleSearch = async (e) => {
    e.preventDefault(); // Prevent page reload
    setError(null); // Clear previous errors
    setProfileData(null); // Clear previous data

    try {
      const response = await fetch(`http://localhost:5000/api/profile/${symbol}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setProfileData(data); // Update state with the fetched data
    } catch (err) {
      setError(err.message); // Update state with the error message
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="sm" sx={{ backgroundColor: '#ffffff', borderRadius: 2, p: 3, boxShadow: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Stock Profile Search
        </Typography>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Stock Symbol"
            variant="outlined"
            fullWidth
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary">
            Search
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {profileData && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h5" component="div">
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
    </Box>
  );
}

export default App;