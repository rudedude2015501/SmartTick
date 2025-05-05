import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function HomeView() {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the most recent 100 trades on component mount
  useEffect(() => {
    const fetchTrades = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch the most recent 100 trades using the limit query parameter
        const response = await fetch(`${apiUrl}/api/trades?limit=100`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setTrades(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, []);

  return (
    <Box>
      <Typography variant="h4" align="center" gutterBottom>
        Recent Trades
      </Typography>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!isLoading && trades.length === 0 && (
        <Typography sx={{ color: 'text.secondary', mt: 2 }} align="center">
          No recent trades found.
        </Typography>
      )}

      {!isLoading && trades.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Politician</strong></TableCell>
                <TableCell><strong>Stock</strong></TableCell>
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
                  <TableCell>
                    {trade.traded_issuer_ticker
                      ? trade.traded_issuer_ticker.split(':')[0] // Remove ":" and everything after it
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {trade.type ? trade.type.charAt(0).toUpperCase() + trade.type.slice(1) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {trade.traded
                      ? new Intl.DateTimeFormat('en-US').format(new Date(trade.traded))
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{trade.size || 'N/A'}</TableCell>
                  <TableCell>{trade.price || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default HomeView;