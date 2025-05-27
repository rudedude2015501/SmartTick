import React, { useState } from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

// ─── Separate politician data ───
const politicianData = [
  { id: 1, name: 'Rep. Smith',      profilePic: '/images/smith.jpg',      totalTrades: 120, totalSpending: 250_000 },
  { id: 2, name: 'Sen. Doe',        profilePic: '/images/doe.jpg',        totalTrades: 95,  totalSpending:  18_500 },
  { id: 3, name: 'Rep. Johnson',    profilePic: '/images/johnson.jpg',    totalTrades: 80,  totalSpending: 160_750 },
  { id: 4, name: 'Sen. Williams',   profilePic: '/images/williams.jpg',   totalTrades: 150, totalSpending:  30_000 },
  { id: 5, name: 'Rep. Brown',      profilePic: '/images/brown.jpg',      totalTrades: 45,  totalSpending:  95_000 },
  { id: 6, name: 'Sen. Davis',      profilePic: '/images/davis.jpg',      totalTrades: 200, totalSpending:  50_000 },
  { id: 7, name: 'Rep. Miller',     profilePic: '/images/miller.jpg',     totalTrades: 60,  totalSpending: 120_000 },
  { id: 8, name: 'Sen. Wilson',     profilePic: '/images/wilson.jpg',     totalTrades: 30,  totalSpending:  50_000 },
  { id: 9, name: 'Rep. Moore',      profilePic: '/images/moore.jpg',      totalTrades: 110, totalSpending: 220_000 },
  { id: 10, name: 'Sen. Taylor',    profilePic: '/images/taylor.jpg',     totalTrades: 85,  totalSpending: 175_000 },
  { id: 11, name: 'Rep. Anderson',  profilePic: '/images/anderson.jpg',   totalTrades: 140, totalSpending: 325_000 },
  { id: 12, name: 'Sen. Thomas',    profilePic: '/images/thomas.jpg',     totalTrades: 25,  totalSpending:  40_000 },
];

export default function Leaderboard() {
  // State: an array of politician IDs in current rank order
  const [rankMapping, setRankMapping] = useState(
    politicianData.map((p) => p.id)
  );

  // Sorting function: takes a key ('totalTrades' or 'totalSpending')
  const sortBy = (key) => {
    // Sort a copy of politicianData descending by the chosen key
    const sortedIds = [...politicianData]
      .sort((a, b) => b[key] - a[key])
      .map((p) => p.id);
    setRankMapping(sortedIds);
  };

  // Build rows array for DataGrid based on current rankMapping
  const rows = rankMapping.map((id, idx) => {
    const p = politicianData.find((x) => x.id === id);
    return {
      id: p.id,
      rank: idx + 1,
      name: p.name,
      profilePic: p.profilePic,
      totalTrades: p.totalTrades,
      totalSpending: p.totalSpending,
    };
  });

  // Column definitions: disable built-in sorting on all columns
  const columns = [
    {
      field: 'rank',
      headerName: 'Rank',
      width: 60,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={params.row.profilePic}
            alt={params.value}
            sx={{ width: 28, height: 28, mr: 1 }}
          />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'totalTrades',
      headerName: 'Total Trades',
      width: 130,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'totalSpending',
      headerName: 'Total Spending',
      width: 150,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      // valueFormatter: ({ value }) => `$${value.toLocaleString()}`,
    },
  ];

  return (
    <Box>
      <Typography
        variant="h5"
        align="center"
        sx={{ mb: 2 }}
      >
        Politician Leaderboard
      </Typography>

      {/* Sort buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => sortBy('totalTrades')}
        >
          By Total Trades
        </Button>
        <Button
          variant="outlined"
          onClick={() => sortBy('totalSpending')}
        >
          By Total Spending
        </Button>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        hideFooter
        disableColumnMenu
        disableSelectionOnClick
        sx={{
          height: 550, // ← Fixed height here
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-columnHeader': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            fontWeight: 'bold',
          },
        }}
      />
    </Box>
  );
}