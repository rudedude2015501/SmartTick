import React, { useState, useEffect, useMemo } from 'react';
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

// Custom hook for pagination
function usePagination(data, itemsPerPage) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const currentData = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, page, itemsPerPage]);

  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setPage((p) => Math.max(p - 1, 1));
  const reset = () => setPage(1);

  return { page, totalPages, currentData, nextPage, prevPage, reset };
}

function HomeView({ searchTerm, onReset }) {
  const [allTrades, setAllTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
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
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, []);

  // Filter trades based on search term
  const filteredTrades = useMemo(() => {
    if (!searchTerm?.trim()) return allTrades;
    const term = searchTerm.trim().toUpperCase();
    return allTrades.filter(trade =>
      trade.traded_issuer_ticker?.split(':')[0] === term
    );
  }, [searchTerm, allTrades]);

  // Pagination
  const { page, totalPages, currentData, nextPage, prevPage, reset } = usePagination(filteredTrades, tradesPerPage);

  // Reset pagination on filter change
  useEffect(() => { reset(); }, [filteredTrades]);

  // Styles
  const tableHeadCellStyle = {
    fontWeight: 'bold',
    color: isDarkMode ? 'grey.100' : 'white',
    width: '13.3%',
  };

  return (
    <Box sx={{ p: 4, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: 'bold', color: isDarkMode ? 'grey.100' : 'primary.main' }}
        >
          {searchTerm ? `Recent Trades for ${searchTerm.toUpperCase()}` : 'Recent Trades'}
        </Typography>
        <Button
          variant="contained"
          onClick={onReset}
          sx={{
            bgcolor: isDarkMode ? 'grey.800' : 'primary.main',
            color: 'white',
            transition: 'none',
            '&:hover': { bgcolor: isDarkMode ? 'grey.700' : 'primary.dark' }
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
        <Alert severity="error">
          {error}
        </Alert>
      )}

      {!isLoading && !error && (
        filteredTrades.length === 0 ? (
          <Typography variant="h6" align="center" sx={{ color: 'text.secondary', mt: 4 }}>
            No recent trades found or incorrect symbol.
          </Typography>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ tableLayout: 'fixed', width: '100%', backgroundColor: isDarkMode ? 'grey.800' : 'primary.light' }}>
                    <TableCell sx={{ ...tableHeadCellStyle, width: '20%'}}>Politician</TableCell>
                    <TableCell sx={tableHeadCellStyle}>Stock</TableCell>
                    <TableCell sx={tableHeadCellStyle}>Trade Type</TableCell>
                    <TableCell sx={tableHeadCellStyle}>Trade Date</TableCell>
                    <TableCell sx={tableHeadCellStyle}>Size</TableCell>
                    <TableCell sx={tableHeadCellStyle}>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentData.map((trade) => (
                    <TableRow
                      key={trade.id}
                      hover
                      sx={{
                        '&:hover': { backgroundColor: 'action.hover' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell>{trade.politician_name || 'N/A'}</TableCell>
                      <TableCell>
                        {trade.traded_issuer_ticker
                          ? trade.traded_issuer_ticker.split(':')[0]
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {trade.type
                          ? trade.type.charAt(0).toUpperCase() + trade.type.slice(1)
                          : 'N/A'}
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
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={prevPage}
                disabled={page === 1}
                sx={{
                  bgcolor: isDarkMode ? 'grey.800' : 'primary.main',
                  color: 'white',
                  transition: 'none',
                  '&:hover': { bgcolor: isDarkMode ? 'grey.700' : 'primary.dark' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography>
                Page {page} of {totalPages}
              </Typography>
              <IconButton
                onClick={nextPage}
                disabled={page === totalPages}
                sx={{
                  bgcolor: isDarkMode ? 'grey.800' : 'primary.main',
                  color: 'white',
                  transition: 'none',
                  '&:hover': { bgcolor: isDarkMode ? 'grey.700' : 'primary.dark' }
                }}
              >
                <ArrowForwardIcon />
              </IconButton>
            </Box>
          </>
        )
      )}
    </Box>
  );
}

export default HomeView;