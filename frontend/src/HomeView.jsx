import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Divider
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { themeQuartz, colorSchemeDark } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

import CongressLeaderboard from './CongressLeaderboard';
import StockLeaderboard from './StockLeaderboard';

ModuleRegistry.registerModules([AllCommunityModule]);

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Simple module-level cache
let tradesCache = null;

export default function HomeView() {
  // ——————————— Trades state ———————————
  const [allTrades, setAllTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ————————— Politicians state —————————
  const [politicianData, setPoliticianData] = useState([]);
  const [politicianCount, setPoliticianCount] = useState(0);
  const [politicianLoading, setPoliticianLoading] = useState(true);
  const [politicianError, setPoliticianError] = useState(null);

  // ————————— Stocks state —————————
  const [stockData, setStockData] = useState([]);
  const [stockCount, setStockCount] = useState(0);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState(null);

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const lightTheme = themeQuartz;
  const darkTheme = themeQuartz.withPart(colorSchemeDark);
  const fetchTimeout = useRef();

  // helper to assign IDs to stock and politician data
  const assignUniqueIds = (arr) =>
  arr.map((item, idx) => ({
    ...item,
    // use name + index (or any other unique combo) for id
    id: `${item.name.replace(/\s+/g, '_').toLowerCase()}_${idx}`,
  }));

  // fetch trades
  useEffect(() => {

    if (tradesCache) {
      setAllTrades(tradesCache);
      setIsLoading(false);
      return;
    }

    const fetchTrades = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/trades`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        tradesCache = data;
        setAllTrades(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrades();
  }, []);


  // ————————— Fetch Politician Stats —————————
  useEffect(() => {
    setPoliticianLoading(true);
    setPoliticianError(null);

    const fetchPoliticians = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/politicians/stats`);
        if (!res.ok) throw new Error(res.statusText);
        const { count, data: results } = await res.json();
        const dataWithIds = assignUniqueIds(results);
        setPoliticianCount(count);
        setPoliticianData(dataWithIds);
      } catch (err) {
        setPoliticianError(err.message);
      } finally {
        setPoliticianLoading(false);
      }
    };

    fetchPoliticians();
  }, [apiUrl]);

  // ————————— Fetch Popular Stocks —————————
  useEffect(() => {
    setStockLoading(true);
    setStockError(null);

    const fetchStocks = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/stocks/popular`);
        if (!res.ok) throw new Error(res.statusText);
        const { count, stocks } = await res.json();
        const dataWithIds = assignUniqueIds(stocks);
        console.log(count);
        setStockCount(count);
        setStockData(dataWithIds);
      } catch (err) {
        setStockError(err.message);
      } finally {
        setStockLoading(false);
      }
    };

    fetchStocks();
  }, [apiUrl]);


  // column definitions for recent trades table
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


  // NEW DESIGN
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, p: 4, alignItems: 'center' }}>
      {/* ─── Top Section: Overall Scores ─── */}
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}
        >
          Market Pulse
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ mb: 3, fontStyle: 'italic', color: 'text.secondary' }}
        >
          Discover the overall buy/sell strength of stocks and performance scores of politicians, all in one snapshot.
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: 300 }}>
              {/* Politician Overall Score Leaderboard Placeholder */}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: 300 }}>
              {/* Stock Buy/Sell Strength Leaderboard Placeholder */}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ width: '80%' }} />

      {/* ─── Middle Section: Recent Trades ─── */}
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}
        >
          Recent Trades
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ mb: 3, fontStyle: 'italic', color: 'text.secondary' }}
        >
          An up-to-date list of the most recent trades made by politicians.
        </Typography>
        <Paper elevation={2} sx={{ flex: 1, p: 2, borderRadius: 3 }}>
          <Box sx={{ flex: 1 }}>
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
          </Box>
        </Paper>
      </Box>

      <Divider sx={{ width: '80%' }} />

      {/* ─── Bottom Section: Metric Rankings ─── */}
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}
        >
          Focused Metrics
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ mb: 3, fontStyle: 'italic', color: 'text.secondary' }}
        >
          Dive deeper into rankings of politicians and stocks by specific metrics.
        </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              p: 2,
            }}
          >
            {/* LEFT: Politician Metrics Leaderboard */}
            <Paper elevation={2} sx={{ width: '50%', p: 2, borderRadius: 3 }}>
              <Box sx={{ width: '100%' }}>
                {politicianLoading
                  ? <CircularProgress />
                  : politicianError
                    ? <Alert severity="error">{politicianError}</Alert>
                    : <CongressLeaderboard
                        data={politicianData}
                        isLoading={politicianLoading}
                        error={politicianError}
                      />}
              </Box>
            </Paper>

            {/* RIGHT: Stock Metrics Leaderboard */}
            <Paper elevation={2} sx={{ flex: 1, p: 2, borderRadius: 3 }}>
              <Box sx={{ width: '100%' }}>
                {stockLoading
                  ? <CircularProgress />
                  : stockError
                    ? <Alert severity="error">{politicianError}</Alert>
                    : <StockLeaderboard
                        data={stockData}
                        isLoading={stockLoading}
                        error={stockError}
                      />}
              </Box>
            </Paper>
          </Box>
      </Box>
    </Box>
  );
}