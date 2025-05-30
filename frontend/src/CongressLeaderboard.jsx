import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DataGrid } from '@mui/x-data-grid';

// List containing data for all politicians
const politicianData = [];

// ─── Metric options ───
const metricOptions = [
  { value: 'total_trades',      label: 'Total Trades',      description: 'Total number of buy and sell trades.' },
  { value: 'estimated_spending', label: 'Estimated Spending', description: 'Approximate total amount spent.' },
  { value: 'sell_trades',        label: 'Sell Trades',        description: 'Number of sell trades executed.' },
  { value: 'buy_trades',         label: 'Buy Trades',         description: 'Number of buy trades executed.' },
  { value: 'buy_percentage',     label: 'Buy %',              description: 'Percent of trades that are buys.' },
  { value: 'different_stocks',   label: 'Trade Diversity',    description: 'Count of distinct stocks traded.' },
];

export default function CongressLeaderboard({
  data,       // <- fetched politicianData
  isLoading,  // <- loading flag
  error       // <- error message (if any)
}) {

  // drop data into local variable
  const politicianData = data;

  // spinner and error display
  if (isLoading) return <CircularProgress />;
  if (error)     return <Alert severity="error">{error}</Alert>;

  const [rankMapping, setRankMapping] = useState(politicianData.map(p => p.id));
  const [selectedMetric, setSelectedMetric] = useState(metricOptions[0].value);

  // for pagination functionality
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // runs once when loading the page to initially sort leaderboard data 
  useEffect(() => {
    const initialSorted = [...politicianData]
      .sort((a, b) => b[selectedMetric] - a[selectedMetric])
      .map(p => p.id);
    setRankMapping(initialSorted);
  }, []); // empty deps so it only runs once

  // automatically sorts leaderboard by the correct metric when selected
  const handleMetricChange = (e) => {
    const key = e.target.value;
    setSelectedMetric(key);
    setRankMapping(
      [...politicianData]
        .sort((a, b) => b[key] - a[key])
        .map(p => p.id)
    );
  };

  const rows = rankMapping.map((id, idx) => {
    const p = politicianData.find(x => x.id === id);
    return {
      id,
      rank: idx + 1,
      name: p.name,
      party: p.party,
      profilePic: p.profilePic,
      metric: p[selectedMetric],
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/*<Avatar src={params.row.profilePic} sx={{ width: 24, height: 24, mr: 1 }} />*/}
          <Typography sx={{ fontWeight: 'bold' }}>{params.value}</Typography>
        </Box>
      ),
      renderHeader: (params) => (
        <Typography sx={{ fontWeight: 'bold' }}>{params.colDef.headerName}</Typography>
      ),
    },
    {
      field: 'party',
      headerName: 'Party',
      flex: 1,
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
      headerName: metricOptions.find(m => m.value === selectedMetric).label,
      width: 180,
      sortable: false,
      headerAlign: 'center',
      align: 'center',

      // VALUE FORMATTING DOES NOT WORK
      // valueFormatter: ({ value }) => {
      //   if (value == null) return '—';
      //   if (selectedMetric === 'estimated_spending') return `$${Number(value).toLocaleString()}`;
      //   if (selectedMetric === 'buy_percentage') return `${Number(value).toFixed(1)}%`;
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
        Politician Leaderboard
      </Typography>

      {/*Metric dropdown selector*/}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <FormControl size="small">
          <InputLabel id="metric-select-label">Metric</InputLabel>
          <Select
            labelId="metric-select-label"
            value={selectedMetric}
            label="Metric"
            onChange={handleMetricChange}
          >
            {metricOptions.map((opt) => (
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

      {/*Main Leaderboard Display*/}
      <DataGrid
        rows={rows}
        columns={columns}

        // pagination options
        pagination
        page={page}
        pageSize={pageSize}
        onPageChange={(newPage)     => setPage(newPage)}
        onPageSizeChange={(size)    => setPageSize(size)}
        rowsPerPageOptions={[5, 10, 25, 50]}  // choose whatever page-sizes you like

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
