import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz, colorSchemeDark } from 'ag-grid-community';

import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([ AllCommunityModule ]);

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function HomeView() {
  const [allTrades, setAllTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const lightTheme = themeQuartz;
  const darkTheme = themeQuartz.withPart(colorSchemeDark);

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

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    { 
      headerName: 'Politician', 
      field: 'politician_name', 
      flex: 1, sortable: true, 
      filter: true 
    },
    { 
      headerName: 'Stock', 
      field: 'traded_issuer_ticker', 
      flex: 1,
      sortable: true, 
      filter: true 
    },
    { 
      headerName: 'Trade Type', 
      field: 'type', 
      flex: 1, 
      valueGetter: params => params.data.type ? params.data.type.charAt(0).toUpperCase() + params.data.type.slice(1) : 'N/A',
      sortable: true, 
      filter: true 
    },
    { 
      headerName: 'Trade Date', 
      field: 'traded', 
      flex: 1, 
      sortable: true, 
      filter: true 
    },
    { 
      headerName: 'Size', 
      field: 'size', 
      flex: 1, 
      sortable: true, 
      filter: true,
      comparator: (a, b) => {
        // Helper to get midpoint from a size string, handling <, K/M suffixes
        const parseNum = (str) => {
          if (!str) return 0;
          let num = parseFloat(str.replace(/,/g, ''));
          if (/k$/i.test(str)) num *= 1_000;
          if (/m$/i.test(str)) num *= 1_000_000;
          return num;
        };
        const getMid = (val) => {
          if (!val) return 0;
          // Handle "<" values: treat as the value it's less than
          if (val.trim().startsWith('<')) {
            const match = val.match(/<\s*([\d,.]+[kKmM]?)/);
            if (match) return parseNum(match[1]);
          }
          // Match numbers with optional K/M suffix
          const nums = val.match(/[\d,.]+[kKmM]?/g);
          if (!nums || nums.length === 0) return 0;
          const n1 = parseNum(nums[0]);
          if (nums.length === 1) return n1;
          const n2 = parseNum(nums[1]);
          return (n1 + n2) / 2;
        };
        return getMid(a) - getMid(b);
      }
    },
    { 
      headerName: 'Price', 
      field: 'price', 
      flex: 1, 
      sortable: true, 
      filter: true,
      comparator: (a, b) => {
        // Remove $ and commas, parse as float for comparison, handle N/A
        const parsePrice = (val) => {
          if (!val || val === 'N/A') return 0;
          const num = parseFloat(val.replace(/[$,]/g, ''));
          return isNaN(num) ? 0 : num;
        };
        return parsePrice(a) - parsePrice(b);
      }
    },
  ], []);

  return (
    <Box>
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
        allTrades.length === 0 ? (
          <Typography variant="h6" align="center" sx={{ color: 'text.secondary', mt: 4 }}>
            No recent trades found.
          </Typography>
        ) : (
          <>
            <Typography variant="h5" align="center" sx={{ mb: 2 }}>
              Recent Trades
            </Typography>
            <div style={{ width: '100%', height: '600px' }}>
              <AgGridReact
                rowData={allTrades}
                columnDefs={columnDefs}
                pagination={true}
                paginationPageSize={20}
                suppressCellFocus={true}
                theme={isDarkMode ? darkTheme : lightTheme}
              />
            </div>
          </>
        )
      )}
    </Box>
  );
}

export default HomeView;