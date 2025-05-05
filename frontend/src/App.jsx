import React, { useState, useMemo } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import InputBase from '@mui/material/InputBase';
import { alpha, styled, createTheme, ThemeProvider } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import Typography from '@mui/material/Typography';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Fab from '@mui/material/Fab';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CssBaseline from '@mui/material/CssBaseline';

// Import the new modularized components
import StockView from './StockView';
import CongressView from './CongressView';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '20ch',
      '&:focus': {
        width: '30ch',
      },
    },
  },
}));

// Fixed position FAB for theme toggle
const ThemeToggleFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
}));

// Main App component
function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedTerm, setSearchedTerm] = useState('');
  const [viewMode, setViewMode] = useState('stock'); // 'stock' or 'congress'
  const [darkMode, setDarkMode] = useState(false); // Track dark/light mode

  // Create theme based on darkMode state
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: darkMode ? '#1976d2' : '#1976d2', // You can customize colors for dark/light modes
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
      }),
    [darkMode]
  );

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Handle search function
  const handleSearch = (event) => {
    event.preventDefault();
    
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) return; // Don't search if input is empty
    
    setSearchedTerm(trimmedTerm); // Store the searched term
  };

  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setSearchTerm(''); // Clear search term when switching views
      setSearchedTerm(''); // Clear searched term when switching views
    }
  };

  // Get placeholder text based on view mode
  const getPlaceholderText = () => {
    return viewMode === 'stock' 
      ? 'Enter Ticker Symbol...' 
      : 'Enter Politician Name...';
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Apply baseline CSS for the theme */}
      
      <AppBar position="fixed">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap>
            SmartTick
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
              size="small"
              sx={{ 
                bgcolor: 'primary.dark',
                '& .MuiToggleButton-root': {
                  color: 'white',
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                }
              }}
            >
              <ToggleButton value="stock" aria-label="stock view">
                <ShowChartIcon sx={{ mr: 1 }} />
                Stocks
              </ToggleButton>
              <ToggleButton value="congress" aria-label="congress view">
                <AccountBalanceIcon sx={{ mr: 1 }} />
                Congress
              </ToggleButton>
            </ToggleButtonGroup>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder={getPlaceholderText()}
                inputProps={{ 'aria-label': 'search' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(e);
                }}
              />
            </Search>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Offset content below fixed AppBar */}
      <Toolbar />

      <Box sx={{ minHeight: 'calc(100vh - 64px)', py: 4, px: 2 }}>
        <Container maxWidth="md">
          {viewMode === 'stock' ? (
            <StockView searchSymbol={searchedTerm} />
          ) : (
            <CongressView searchTerm={searchedTerm} />
          )}
        </Container>
      </Box>

      {/* Dark mode toggle button */}
      <ThemeToggleFab 
        color="primary" 
        aria-label="toggle dark mode"
        onClick={toggleDarkMode}
      >
        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </ThemeToggleFab>
    </ThemeProvider>
  );
}

export default App;