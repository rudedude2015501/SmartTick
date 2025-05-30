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

const politicianData = [
  {
    id: 1,
    name: 'Rep. Jane Thompson',
    party: 'Democrat - NY',
    profilePic: '/images/jane_thompson.jpg',
    score: 91.3
  },
  {
    id: 2,
    name: 'Sen. Michael Carter',
    party: 'Republican - TX',
    profilePic: '/images/michael_carter.jpg',
    score: 87.5
  },
  {
    id: 3,
    name: 'Rep. Aisha Patel',
    party: 'Independent - CA',
    profilePic: '/images/aisha_patel.jpg',
    score: 79.8
  },
  {
    id: 4,
    name: 'Sen. Luis Ramirez',
    party: 'Democrat - IL',
    profilePic: '/images/luis_ramirez.jpg',
    score: 76.4
  },
  {
    id: 5,
    name: 'Rep. Karen Zhao',
    party: 'Republican - FL',
    profilePic: '/images/karen_zhao.jpg',
    score: 68.1
  }
];
const stockData = [
  {
    id: 101,
    name: 'Apple Inc',
    symbol: 'AAPL',
    score: 95.2
  },
  {
    id: 102,
    name: 'Microsoft Corp',
    symbol: 'MSFT',
    score: 92.7
  },
  {
    id: 103,
    name: 'Tesla Inc',
    symbol: 'TSLA',
    score: 88.9
  },
  {
    id: 104,
    name: 'Amazon.com Inc',
    symbol: 'AMZN',
    score: 85.3
  },
  {
    id: 105,
    name: 'NVIDIA Corp',
    symbol: 'NVDA',
    score: 83.5
  }
];


export function CongressOverall({
  data,       // <- fetched data
  isLoading,  // <- loading flag
  error       // <- error message (if any)
}) {

  // drop data into local variable
  // const politicianData = data;

  // spinner and error display
  // if (isLoading) return <CircularProgress />;
  // if (error)     return <Alert severity="error">{error}</Alert>;

  const [rankMapping, setRankMapping] = useState(politicianData.map(p => p.id));
  // const [selectedMetric, setSelectedMetric] = useState(metricOptions[0].value);

  // for pagination functionality
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // effect to do initial sorting of data on page load
  // useEffect(() => {
  //   const initialSorted = [...politicianData]
  //     .sort((a, b) => b[selectedMetric] - a[selectedMetric])
  //     .map(p => p.id);
  //   setRankMapping(initialSorted);
  // }, []); // empty deps so it only runs once


  // const handleMetricChange = (e) => {
  //   const key = e.target.value;
  //   setSelectedMetric(key);
  //   setRankMapping(
  //     [...politicianData]
  //       .sort((a, b) => b[key] - a[key])
  //       .map(p => p.id)
  //   );
  // };

  const rows = rankMapping.map((id, idx) => {
    const p = politicianData.find(x => x.id === id);
    return {
      id,
      rank: idx + 1,
      name: p.name,
      party: p.party,
      profilePic: p.profilePic,
      score: p.score,
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
          <Avatar src={params.row.profilePic} sx={{ width: 24, height: 24, mr: 1 }} />
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
      field: 'score',
      headerName: 'Score',
      width: 160,
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
        Top Politicians
      </Typography>

      <Typography
        variant="subtitle1"
        sx={{ mb: 3, fontStyle: 'italic', color: 'text.secondary' }}
      >
        See the most active and best performing politicians based on trade data.
      </Typography>

{/*      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
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
      </Box>*/}

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

      <Typography
        variant="subtitle1"
        sx={{ fontStyle: 'italic', color: 'text.secondary', 
              textAlign: 'left', alignItems: 'center', p: 1, mb: 3.5 }}
      >
        Note: Scores are based on a custom formula that accounts for a variety of metrics,
        such as the number of trades and estimated spending of each politician.
      </Typography>
    </Box>
  );
}

export function StockOverall({
  // data,       // <- fetched stockData
  // isLoading,  // <- loading flag
  // error       // <- error message (if any)
}) {

  // drop data into local variable
  // const stockData = data;

  // spinner and error display
  // if (isLoading) return <CircularProgress />;
  // if (error)     return <Alert severity="error">{error}</Alert>;

  const [rankMapping, setRankMapping] = useState(
    stockData
      .filter((s) => s.symbol !== 'N/A')
      .map((s) => s.id)
  );

  // const [selectedMetric, setSelectedMetric] = useState(stockMetrics[0].value);

  // for pagination functionality
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);


  // useEffect(() => {
  //   const initial = stockData
  //     .filter(s => s.symbol !== 'N/A')
  //     .sort((a, b) => b[selectedMetric] - a[selectedMetric])
  //     .map(s => s.id);
  //   setRankMapping(initial);
  // }, []); // empty deps so it only runs once


  // const handleMetricChange = (e) => {
  //   const key = e.target.value;
  //   setSelectedMetric(key);
  //   setRankMapping(
  //     stockData
  //       .filter((s) => s.symbol !== 'N/A')
  //       .sort((a, b) => b[key] - a[key])
  //       .map((s) => s.id)
  //   );
  // };

  const rows = rankMapping.map((id, idx) => {
    const s = stockData.find((x) => x.id === id);
    return {
      id,
      rank: idx + 1,
      name: s.name,
      symbol: s.symbol,
      score: s.score,
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
      field: 'score',
      headerName: 'Score',
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
        Top Stocks
      </Typography>

      <Typography
        variant="subtitle1"
        sx={{ mb: 3, fontStyle: 'italic', color: 'text.secondary' }}
      >
        See the overall buy/sell strength of stocks based on financial info and analysis.
      </Typography>


{/*      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
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
*/}
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

      <Typography
        variant="subtitle1"
        sx={{ fontStyle: 'italic', color: 'text.secondary', 
              textAlign: 'left', alignItems: 'center', p: 1 }}
      >
        Note: Scores are based on a custom formula that accounts for a variety of metrics,
        such as various technical indicators. Higher scores (> 50) indicate a stronger buy, 
        and lower scores indicate a stronger sell. 
      </Typography>
    </Box>
  );
}
