import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import HomeIcon from '@mui/icons-material/Home';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import MenuList from '@mui/material/MenuList';
import CircularProgress from '@mui/material/CircularProgress';
import debounce from 'lodash/debounce'; 

// Import the view components
import StockView from './StockView';
import CongressView from './CongressView';
import HomeView from './HomeView';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Styled components - keeping original styling
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
  width: '100%',
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
  const [viewMode, setViewMode] = useState('home'); // Default view mode
  const [darkMode, setDarkMode] = useState(false); // Track dark/light mode
  const [anchorEl, setAnchorEl] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

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

  // "debounce" fetch function to improve performance
  const debouncedFetch = useCallback(
    debounce((value) => {
      setLoading(true);
      
      fetch(`${apiUrl}/api/autocomplete/stocks?query=${encodeURIComponent(value)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          // sort symbols in dropdown by alphabetical order 
          const sortedData = data.sort((a, b) => a.symbol.localeCompare(b.symbol));
          setOptions(sortedData);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching autocomplete data:', error);
          setLoading(false);
          setOptions([]);
        });
    }, 300), // 300ms delay for debouncing 
    []
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
    
    setAnchorEl(null);
    setOpen(false);
    setSearchedTerm(trimmedTerm); // Store the searched term
  };

  // Handle autocomplete selection
  const handleOptionClick = (option) => {
    setSearchTerm(option.symbol);
    setSearchedTerm(option.symbol);
    setAnchorEl(null);
    setOpen(false);
  };

  // Close the autocomplete dropdown
  const handleClose = () => {
    setOpen(false);
  };

  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
      setSearchTerm(''); // Clear search term when switching views
      setSearchedTerm(''); // Clear searched term when switching views
      setOpen(false);
    }
  };

  // Handle input change for autocomplete
  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setAnchorEl(event.currentTarget);

    // Fetch autocomplete options when input has at least 1 character
    if (value.length >= 1) {
      setLoading(true);
      setOpen(true);
      
      // Call the backend autocomplete API endpoint
      fetch(`${apiUrl}/api/autocomplete/stocks?query=${encodeURIComponent(value)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          setOptions(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching autocomplete data:', error);
          setLoading(false);
          setOptions([]);
        });
    } else {
      setOptions([]);
      setOpen(false);
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
                bgcolor: darkMode ? 'background.paper' : 'primary.dark', // Background color based on darkMode
                '& .MuiToggleButton-root': {
                  color: darkMode ? 'white' : 'white', // Text color
                  width: 150, // Set a consistent width for all buttons
                  height: 40, // Set a consistent height for all buttons
                  '&.Mui-selected': {
                    bgcolor: darkMode ? 'grey.700' : 'primary.light', // Selected background color
                    color: darkMode ? 'white' : 'white', // Selected text color
                    '&:hover': {
                      bgcolor: darkMode ? 'grey.600' : 'primary.light', // Hover effect for selected button
                    },
                  },
                  '&:hover': {
                    bgcolor: darkMode ? 'grey.800' : 'primary.main', // Hover effect for unselected button
                  },
                },
              }}
            >
              <ToggleButton value="home" aria-label="home view">
                <HomeIcon sx={{ mr: 1 }} />
                Home
              </ToggleButton>
              <ToggleButton value="stock" aria-label="stock view">
                <ShowChartIcon sx={{ mr: 1 }} />
                Stocks
              </ToggleButton>
              <ToggleButton value="congress" aria-label="congress view">
                <AccountBalanceIcon sx={{ mr: 1 }} />
                Congress
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Conditionally render the search bar */}
            {viewMode !== 'home' && (
              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder={getPlaceholderText()}
                  inputProps={{ 'aria-label': 'search' }}
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch(e);
                  }}
                />
                
                {/* Autocomplete Dropdown */}
                {viewMode === 'stock' && (
                  <Popper 
                    open={open} 
                    anchorEl={anchorEl}
                    placement="bottom-start"
                    style={{ zIndex: 1301, width: anchorEl ? anchorEl.clientWidth : null }}
                  >
                    <Paper>
                      <ClickAwayListener onClickAway={handleClose}>
                        <MenuList>
                          {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : options.length > 0 ? (
                            options.map((option) => (
                              <MenuItem 
                                key={option.symbol} 
                                onClick={() => handleOptionClick(option)}
                              >
                                <strong>{option.symbol}</strong> - {option.name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>No stocks found</MenuItem>
                          )}
                        </MenuList>
                      </ClickAwayListener>
                    </Paper>
                  </Popper>
                )}
              </Search>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Offset content below fixed AppBar */}
      <Toolbar />

      <Box sx={{ minHeight: 'calc(100vh - 64px)', py: 4, px: 2 }}>
        <Container maxWidth="md">
          {viewMode === 'home' ? (
            <HomeView />
          ) : viewMode === 'stock' ? (
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