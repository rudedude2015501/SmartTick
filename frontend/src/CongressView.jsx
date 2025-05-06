import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Paper from '@mui/material/Paper';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function CongressView({ searchTerm }) {
  const [congressmanData, setCongressmanData] = useState(null);
  const [tradesData, setTradesData] = useState([]);
  const [isLoadingCongressman, setIsLoadingCongressman] = useState(false);
  const [congressmanError, setCongressmanError] = useState(null);

  // Placeholder data for UI design until API endpoints are ready
  // This will be replaced with real data fetching when backend endpoints are implemented
  React.useEffect(() => {
    if (!searchTerm) return;
    
    setIsLoadingCongressman(true);
    setCongressmanError(null);
    
    // mock data
    if (searchTerm.toLowerCase() === "bob") {
        setCongressmanData({
          name: "bob",
          role: "Representative",
          state: "state",
          party: "(PARTY)",
          since: "1776",
          committees: ["Committee 1", "Committee 2"],
        });
        
        setTradesData([
          {
            id: 1,
            ticker: "AAPL",
            company: "Apple Inc.",
            date: "2025-04-01",
            type: "buy",
            amount: "",
            price: "$"
          },
          {
            id: 2,
            ticker: "MSFT",
            company: "Microsoft Corporation",
            date: "2025-03-15",
            type: "buy",
            amount: "",
            price: "$"
          },
          {
            id: 3,
            ticker: "TSLA",
            company: "Tesla, Inc.",
            date: "2025-02-22",
            type: "sell",
            amount: "",
            price: "$"
          },
          {
            id: 4,
            ticker: "NVDA",
            company: "NVIDIA Corporation",
            date: "2025-01-10",
            type: "buy",
            amount: "",
            price: "$"
          }
        ]);
    } else {
        setCongressmanError("No congressman found with that name. Please try another search.");
        setCongressmanData(null);
        setTradesData([]);
      }
      
    setIsLoadingCongressman(false);
    
  }, [searchTerm]);

  if (!searchTerm) {
    return (
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 10 }}>
        Enter a congressman's name in the search bar above to view their profile and trade history.
      </Typography>
    );
  }

  return (
    <Box>
      {/* Congressman Profile Section */}
      <Box mb={4}>
        <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
          <CardContent>
            {isLoadingCongressman && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}
            {congressmanError && <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>{congressmanError}</Alert>}
            {!isLoadingCongressman && !congressmanError && !congressmanData && (
              <Typography sx={{ p: 2, color: 'text.secondary' }}>No congressman data found.</Typography>
            )}
            {congressmanData && (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ width: 120, height: 120, bgcolor: 'primary.light' }}
                    src={congressmanData.profile_image}
                  >
                    <PersonIcon sx={{ fontSize: 80 }} />
                  </Avatar>
                </Grid>
                <Grid item xs={12} sm={8} md={9}>
                  <Typography variant="h5" component="div" gutterBottom>
                    {congressmanData.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {congressmanData.role} ({congressmanData.party}) - {congressmanData.state}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Serving since:</strong> {congressmanData.since}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Committees:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {congressmanData.committees.map((committee, index) => (
                        <Chip 
                          key={index} 
                          label={committee} 
                          size="small" 
                          sx={{ 
                            bgcolor: 'primary.light', 
                            color: 'primary.contrastText' 
                          }} 
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Recent Trades Section */}
      <Box>
        <Card sx={{ boxShadow: 3, borderRadius: 2, p: 2, minHeight: 450 }}>
          <Typography variant="h6" component="div" sx={{ mb: 3 }}>
            Recent Trades
          </Typography>
          
          {isLoadingCongressman && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 300 }}>
              <CircularProgress />
            </Box>
          )}
          
          {!isLoadingCongressman && !congressmanError && tradesData.length === 0 && (
            <Typography sx={{ p: 2, color: 'text.secondary', textAlign: 'center', mt: 4 }}>
              No trade history found for this congressman.
            </Typography>
          )}
          
          {!isLoadingCongressman && tradesData.length > 0 && (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {tradesData.map((trade) => (
                <Paper 
                  key={trade.id} 
                  elevation={1} 
                  sx={{ mb: 2, borderLeft: `4px solid ${trade.type === 'buy' ? '#4ade80' : '#f87171'}` }}
                >
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: trade.type === 'buy' ? 'success.light' : 'error.light' }}>
                        {trade.ticker.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <React.Fragment>
                          <Typography component="span" variant="subtitle1" color="text.primary">
                            {trade.company} ({trade.ticker})
                          </Typography>
                          <Typography 
                            component="span" 
                            variant="body2" 
                            sx={{ 
                              ml: 2,
                              color: trade.type === 'buy' ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {trade.type.toUpperCase()}
                          </Typography>
                        </React.Fragment>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary">
                            Amount: {trade.amount} • Price: {trade.price}
                          </Typography>
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                            {new Date(trade.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </Card>
      </Box>
    </Box>
  );
}

export default CongressView;