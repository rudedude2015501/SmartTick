import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DataGrid } from '@mui/x-data-grid';

// ─── Sample stock data ───
const stockData = [
  { id: 'MSFT', name: 'Microsoft Corp', symbol: 'MSFT:US', buy_count: 49, sell_count: 75, buy_ratio: 39.5, trade_count: 124 },
  { id: 'AAPL', name: 'Apple Inc.',      symbol: 'AAPL:US', buy_count: 60, sell_count: 90, buy_ratio: 40.0, trade_count: 150 },
  // … add more entries as needed …
];

// ─── Metric options for stocks ───
const stockMetrics = [
  { value: 'trade_count', label: 'Trade Count', description: 'Total number of trades for this stock.' },
  { value: 'buy_count',   label: 'Buy Count',   description: 'Number of buy orders executed.' },
  { value: 'sell_count',  label: 'Sell Count',  description: 'Number of sell orders executed.' },
  { value: 'buy_ratio',   label: 'Buy %',       description: 'Percentage of trades that are buys.' },
];

export default function StockLeaderboard() {
  const [rankMapping, setRankMapping] = useState(stockData.map((s) => s.id));
  const [selectedMetric, setSelectedMetric] = useState(stockMetrics[0].value);

  const handleMetricChange = (e) => {
    const key = e.target.value;
    setSelectedMetric(key);
    setRankMapping(
      [...stockData]
        .sort((a, b) => b[key] - a[key])
        .map((s) => s.id)
    );
  };

  const rows = rankMapping.map((id, idx) => {
    const s = stockData.find((x) => x.id === id);
    return {
      id,
      rank: idx + 1,
      name: s.name,
      symbol: s.symbol,
      metric: s[selectedMetric],
    };
  });

  const columns = [
    {
      field: 'rank',
      headerName: 'Rank',
      width: 80,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 'bold', width: '100%', textAlign: 'center' }}>
          {params.value}
        </Typography>
      ),
      renderHeader: (params) => (
        <Typography sx={{ fontWeight: 'bold', width: '100%', textAlign: 'center' }}>
          {params.colDef.headerName}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      sortable: false,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 'bold' }}>{params.value}</Typography>
      ),
      renderHeader: (params) => (
        <Typography sx={{ fontWeight: 'bold' }}>{params.colDef.headerName}</Typography>
      ),
    },
    {
      field: 'symbol',
      headerName: 'Symbol',
      width: 120,
      sortable: false,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => <Typography>{params.value}</Typography>,
      renderHeader: (params) => (
        <Typography sx={{ fontWeight: 'bold' }}>{params.colDef.headerName}</Typography>
      ),
    },
    {
      field: 'metric',
      headerName: stockMetrics.find((m) => m.value === selectedMetric).label,
      width: 160,
      sortable: false,
      headerAlign: 'center',
      align: 'center',

      // VALUE FORMATTING DOES NOT WORK
      // valueFormatter: ({ value }) => {
      //   if (value == null) return '—';
      //   if (selectedMetric === 'buy_ratio') return `${Number(value).toFixed(1)}%`;
      //   return Number(value).toLocaleString();
      // },
      
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 'bold', width: '100%', textAlign: 'center' }}>
          {params.formattedValue}
        </Typography>
      ),
      renderHeader: (params) => (
        <Typography sx={{ fontWeight: 'bold', width: '100%', textAlign: 'center' }}>
          {params.colDef.headerName}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" align="center" sx={{ mb: 2 }}>
        Stock Leaderboard
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <FormControl size="small">
          <InputLabel id="stock-metric-select-label">Metric</InputLabel>
          <Select
            labelId="stock-metric-select-label"
            value={selectedMetric}
            label="Metric"
            onChange={handleMetricChange}
          >
            {stockMetrics.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  {opt.label}
                  <Tooltip title={opt.description} arrow>
                    <InfoOutlinedIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                  </Tooltip>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        hideFooter
        disableColumnMenu
        disableSelectionOnClick
        sx={{
          height: 550,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          '& .MuiDataGrid-columnHeader': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }
        }}
      />
    </Box>
  );
}