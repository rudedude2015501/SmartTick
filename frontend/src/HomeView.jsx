import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz, colorSchemeDark } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

import Leaderboard from './Leaderboard';

ModuleRegistry.registerModules([AllCommunityModule]);

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function HomeView() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const lightTheme = themeQuartz;
  const darkTheme = themeQuartz.withPart(colorSchemeDark);

  const [allTrades, setAllTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // fetch trades
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    fetch(`${apiUrl}/api/trades?limit=1000000`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(setAllTrades)
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  // same columnDefs you already had
  const columnDefs = useMemo(() => [
    {
      headerName: 'Politician',
      field: 'politician_name',
      flex: 1,
      sortable: true,
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
      valueGetter: params =>
        params.data.type
          ? params.data.type.charAt(0).toUpperCase() +
            params.data.type.slice(1)
          : 'N/A',
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
        const parseNum = str => {
          if (!str) return 0;
          let num = parseFloat(str.replace(/,/g, ''));
          if (/k$/i.test(str)) num *= 1_000;
          if (/m$/i.test(str)) num *= 1_000_000;
          return num;
        };
        const getMid = val => {
          if (!val) return 0;
          if (val.trim().startsWith('<')) {
            const m = val.match(/<\s*([\d,.]+[kKmM]?)/);
            if (m) return parseNum(m[1]);
          }
          const nums = val.match(/[\d,.]+[kKmM]?/g) || [];
          const n1 = parseNum(nums[0] || '');
          if (nums.length < 2) return n1;
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
        const parsePrice = val => {
          if (!val || val === 'N/A') return 0;
          const num = parseFloat(val.replace(/[$,]/g, ''));
          return isNaN(num) ? 0 : num;
        };
        return parsePrice(a) - parsePrice(b);
      }
    },
  ], []);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start',
        p: 2,
      }}
    >
      {/* LEFT: Leaderboard */}
      <Paper elevation={2} sx={{ width: '40%', p: 2, borderRadius: 3 }}>
      {/*<Box sx={{ width: '40%' }}>*/}
        <Leaderboard />
      {/*</Box>*/}
      </Paper>

      {/* RIGHT: Recent Trades */}
      <Paper elevation={2} sx={{ flex: 1, p: 2, borderRadius: 3 }}>
      {/*<Box sx={{ flex: 1 }}>*/}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!isLoading && !error && (
          allTrades.length === 0 ? (
            <Typography
              variant="h6"
              align="center"
              sx={{ color: 'text.secondary', mt: 4 }}
            >
              No recent trades found.
            </Typography>
          ) : (
            <>
              <Typography variant="h5" align="center" sx={{ mb: 2 }}>
                Recent Trades
              </Typography>
              <Box sx={{ width: '100%', height: 600 }}>
                <AgGridReact
                  rowData={allTrades}
                  columnDefs={columnDefs}
                  pagination
                  paginationPageSize={20}
                  suppressCellFocus
                  theme={isDarkMode ? darkTheme : lightTheme}
                />
              </Box>
            </>
          )
        )}
      {/*</Box>*/}
      </Paper>
    </Box>
  );
}