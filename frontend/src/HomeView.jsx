import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function HomeView({ searchTerm, onReset }) {
  const [allTrades, setAllTrades] = useState([]);
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 10;
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Fetch the trades on component mount
  useEffect(() => {
    const fetchTrades = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/trades?limit=1000000`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setAllTrades(data);
        setTrades(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, []);

  // Filter trades based on search term
  useEffect(() => {
    if (!allTrades || allTrades.length === 0) return;

    const term = searchTerm.trim().toUpperCase();

    if (!term) {
      setTrades(allTrades);
    } else {
      const filtered = allTrades.filter(trade =>
        trade.traded_issuer_ticker.split(':')[0].includes(term)
      );
      setTrades(filtered);
    }

    setCurrentPage(1);
  }, [searchTerm, allTrades]);

  // Calculate trades to display for the current page
  const totalPages = Math.ceil(trades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const currentTrades = trades.slice(startIndex, startIndex + tradesPerPage);

  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: 'bold', color: isDarkMode ? 'grey.100' : 'primary.main' }}
        >
          {searchTerm ? `Recent Trades for ${searchTerm}` : 'Recent Trades'}
        </Typography>
        <Button
          variant="contained"
          onClick={onReset}
          sx={{
            bgcolor: isDarkMode ? 'grey.800' : 'primary.main',
            color: 'white',
            transition: 'none', 
            '&:hover': {
              bgcolor: isDarkMode ? 'grey.700' : 'primary.dark',
            }
          }}
        >
          Reset
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            bgcolor: isDarkMode ? 'error.dark' : undefined,
            color: isDarkMode ? 'grey.100' : undefined,
          }}
        >
          {error}
        </Alert>
      )}

      {!isLoading && trades.length === 0 && (
        <Typography
          variant="h6"
          align="center"
          sx={{ color: 'text.secondary', mt: 4 }}
        >
          No recent trades found.
        </Typography>
      )}

      {!isLoading && trades.length > 0 && (
        <>
          <Box sx={{ width: '100%' }}>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: isDarkMode ? 'grey.800' : 'primary.light' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: isDarkMode ? 'grey.100' : 'white', minWidth: 150 }}>Politician</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: isDarkMode ? 'grey.100' : 'white', minWidth: 100 }}>Stock</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: isDarkMode ? 'grey.100' : 'white', minWidth: 100 }}>Trade Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: isDarkMode ? 'grey.100' : 'white', minWidth: 120 }}>Trade Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: isDarkMode ? 'grey.100' : 'white', minWidth: 100 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: isDarkMode ? 'grey.100' : 'white', minWidth: 100 }}>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentTrades.map((trade) => (
                    <TableRow
                      key={trade.id}
                      hover
                      sx={{
                        '&:hover': { backgroundColor: isDarkMode ? 'grey.900' : 'action.hover' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell sx={{ minWidth: 150 }}>{trade.politician_name || 'N/A'}</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        {trade.traded_issuer_ticker
                          ? trade.traded_issuer_ticker.split(':')[0]
                          : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        {trade.type
                          ? trade.type.charAt(0).toUpperCase() + trade.type.slice(1)
                          : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        {trade.traded
                          ? new Intl.DateTimeFormat('en-US').format(new Date(trade.traded))
                          : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>{trade.size || 'N/A'}</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>{trade.price || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              sx={{
                bgcolor: isDarkMode ? 'grey.800' : 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: isDarkMode ? 'grey.700' : 'primary.dark',
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography>
              Page {currentPage} of {totalPages}
            </Typography>
            <IconButton
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              sx={{
                bgcolor: isDarkMode ? 'grey.800' : 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: isDarkMode ? 'grey.700' : 'primary.dark',
                }
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );
}

export default HomeView;