import { useState, useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import InputBase from '@mui/material/InputBase';
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
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, styled, createTheme, ThemeProvider } from '@mui/material/styles';

// Import the view components
import HomeView from './HomeView';
import StockView from './StockView';
import CongressView from './CongressView';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Styled components
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.25) },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: { marginLeft: theme.spacing(1), width: 'auto' },
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
    width: '100%',
    [theme.breakpoints.up('sm')]: {width: '20ch'},
  },
}));

// theme toggle
const ThemeToggleFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
}));

// View mode constants
const VIEW_HOME = 'home';
const VIEW_STOCK = 'stock';
const VIEW_CONGRESS = 'congress';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedTerm, setSearchedTerm] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_HOME);
  const [darkMode, setDarkMode] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Theme
  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: { main: '#1976d2' },
        background: {
          default: darkMode ? '#121212' : '#f5f5f5',
          paper: darkMode ? '#1e1e1e' : '#fff',
        },
      },
    }), [darkMode]
  );

  // Debounced fetch for autocomplete (keep only one)
  const debouncedFetch = useCallback(
    debounce((value, endpoint) => {
      fetchData(value, endpoint);
    }, 200),
    []
  );

  const fetchData = (value, endpoint) => {
    setLoading(true);
    fetch(`${apiUrl}/api/autocomplete/${endpoint}?query=${encodeURIComponent(value)}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (endpoint === 'stocks') {
          setOptions(data);
        } else {
          setOptions(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(`Error fetching autocomplete data from ${endpoint}:`, err);
        setLoading(false);
        setOptions([]);
      });
  };

  // Handlers
  const toggleDarkMode = () => setDarkMode(d => !d);

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setAnchorEl(null);
    setOpen(false);
    setSearchedTerm(trimmed);
  };

  const handleOptionClick = (option) => {
    if (viewMode === VIEW_STOCK || viewMode === VIEW_HOME) {
      setSearchTerm(option.symbol);
      setSearchedTerm(option.symbol);
    } else {
      setSearchTerm(option.name);
      setSearchedTerm(option.name);
    }
    setAnchorEl(null);
    setOpen(false);
  };

  const handleClose = () => setOpen(false);

  const handleViewModeChange = (event, newMode) => {
    if (!newMode) return;
    setViewMode(newMode);
    setSearchTerm('');
    setSearchedTerm('');
    setOpen(false);
    setOptions([]);
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setAnchorEl(event.currentTarget);

    // Reset highlighted index when input changes
    setHighlightedIndex(-1);

    // Fetch autocomplete options when input has at least 1 character
    if (value.length >= 1) {
      setOpen(true);
      const endpoint = (viewMode === VIEW_STOCK || viewMode === VIEW_HOME) ? 'stocks' : 'politicians';
      if (searchTerm === '') {
        // No debounce if previous search was empty
        fetchData(value, endpoint);
      } else {
        // Debounced fetch otherwise
        debouncedFetch(value, endpoint);
      }
    } else {
      setOptions([]);
      setOpen(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!open) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault(); 
        setHighlightedIndex(prevIndex => {
          const newIndex = prevIndex < options.length - 1 ? prevIndex + 1 : 0;
          return newIndex;
        });
        break;
        
      case 'ArrowUp':
        event.preventDefault(); 
        setHighlightedIndex(prevIndex => {
          const newIndex = prevIndex > 0 ? prevIndex - 1 : options.length - 1;
          return newIndex;
        });
        break;
        
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          event.preventDefault();
          handleOptionClick(options[highlightedIndex]);
        } else {
          handleSearch(event);
        }
        break;
        
      case 'Escape':
        setOpen(false);
        break;
        
      default:
        break;
    }
  };

  const getPlaceholderText = () =>
    (viewMode === VIEW_STOCK || viewMode === VIEW_HOME)
      ? 'Enter Ticker Symbol...'
      : 'Enter Politician Name...';

  const resetSearch = () => {
    setSearchTerm('');
    setSearchedTerm('');
  };

  // Render
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap>SmartTick</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
              size="small"
              sx={{
                bgcolor: darkMode ? 'background.paper' : 'primary.dark',
                '& .MuiToggleButton-root': {
                  color: 'white',
                  width: 150,
                  height: 40,
                  '&.Mui-selected': {
                    bgcolor: darkMode ? 'grey.700' : 'primary.light',
                    color: 'white',
                    '&:hover': { bgcolor: darkMode ? 'grey.600' : 'primary.light' },
                  },
                  '&:hover': { bgcolor: darkMode ? 'grey.800' : 'primary.main' },
                },
              }}
            >
              <ToggleButton value={VIEW_HOME} aria-label="home view">
                <HomeIcon sx={{ mr: 1 }} />Home
              </ToggleButton>
              <ToggleButton value={VIEW_STOCK} aria-label="stock view">
                <ShowChartIcon sx={{ mr: 1 }} />Stocks
              </ToggleButton>
              <ToggleButton value={VIEW_CONGRESS} aria-label="congress view">
                <AccountBalanceIcon sx={{ mr: 1 }} />Congress
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
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
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
                        options.map((option, idx) => (
                          <MenuItem
                            key={(viewMode === VIEW_STOCK || viewMode === VIEW_HOME) ? option.symbol : option.name}
                            onClick={() => handleOptionClick(option)}
                            selected={idx === highlightedIndex}
                            sx={{
                              backgroundColor: idx === highlightedIndex ? 'action.selected' : 'inherit',
                              '&:hover': {
                                backgroundColor: idx === highlightedIndex ? 'action.selected' : 'action.hover',
                              },
                            }}
                          >
                            {(viewMode === VIEW_STOCK || viewMode === VIEW_HOME) ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                <Typography noWrap variant="body2"><strong>{option.symbol}</strong></Typography>
                                <Typography noWrap variant="caption" color="text.secondary">{option.name}</Typography>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                <Typography noWrap variant="body2"><strong>{option.name}</strong></Typography>
                                <Typography noWrap variant="caption" color="text.secondary">{option.affiliation}</Typography>
                              </Box>
                            )}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>
                          {`No ${(viewMode === VIEW_STOCK || viewMode === VIEW_HOME) ? 'stocks' : 'politicians'} found`}
                        </MenuItem>
                      )}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Popper>
            </Search>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Offset content below fixed AppBar */}
      <Toolbar />
      <Box sx={{ minHeight: 'calc(100vh - 64px)', py: 4, px: 2 }}>
        <Container maxWidth="md">
          {viewMode === VIEW_HOME ? (
            <HomeView searchTerm={searchedTerm} onReset={resetSearch} />
          ) : viewMode === VIEW_STOCK ? (
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