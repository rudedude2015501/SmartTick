import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TradeCard({ trade, label, color, active }) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        bgcolor: active ? 'background.paper' : 'grey.100',
        boxShadow: active ? 4 : 1,
        borderRadius: 3,
        minWidth: 0,
        opacity: active ? 1 : 0.7,
        borderColor: active ? color + '.light' : 'grey.300',
        transition: 'box-shadow 0.25s cubic-bezier(.4,2,.6,1), border-color 0.2s, transform 0.25s cubic-bezier(.4,2,.6,1)',
        '&:hover': {
          boxShadow: 12,
          borderColor: color + '.main',
          transform: 'translateY(-8px) scale(1.04)'
        },
        p: 0,
        position: 'relative'
      }}
    >
      {/* Top-right label */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 14,
          bgcolor: color + '.main',
          color: color + '.contrastText',
          px: 1.2,
          py: 0.3,
          borderRadius: 2,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.5,
          opacity: active ? 0.95 : 0.5,
          zIndex: 1
        }}
      >
        {label}
      </Box>
      <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {trade ? (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
              {trade.traded}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: color + '.main', mb: 0.5 }}>
              {trade.traded_issuer_ticker}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color:
                  trade.type && trade.type.toLowerCase() === 'buy'
                    ? 'success.main'
                    : trade.type && trade.type.toLowerCase() === 'sell'
                    ? 'error.main'
                    : 'text.secondary',
                textTransform: 'capitalize',
                mb: 0.5
              }}
            >
              {trade.type}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {trade.size}
            </Typography>
          </>
        ) : (
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {label === 'Most Recent' ? 'No recent trade' : 'No biggest trade'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function CongressView({ searchTerm }) {
  const [profileData, setProfileData] = useState([null, '', '']); // [img, name, family]
  const [isLoading, setIsLoading] = useState(false);
  const [latestTrade, setLatestTrade] = useState(null);
  const [biggestTrade, setBiggestTrade] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!searchTerm) {
      setProfileData([null, '', '']);
      setLatestTrade(null);
      setBiggestTrade(null);
      setStats(null);
      return;
    }
    setIsLoading(true);
    setProfileData([null, '', '']);
    setLatestTrade(null);
    setBiggestTrade(null);
    setStats(null);

    fetch(`${apiUrl}/api/pol/image?name=${encodeURIComponent(searchTerm)}`)
      .then(res => res.json())
      .then(data => {
        const imgUrl = data.img ? `https://www.capitoltrades.com${data.img}` : null;
        setProfileData([imgUrl, data.politician_name || '', data.politician_family || '']);
        setIsLoading(false);
      })
      .catch(() => {
        setProfileData([null, '', '']);
        setIsLoading(false);
      });

    fetch(`${apiUrl}/api/politicians/${encodeURIComponent(searchTerm)}/latest-trade`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setLatestTrade(data && !data.error ? data : null))
      .catch(() => setLatestTrade(null));

    fetch(`${apiUrl}/api/politicians/${encodeURIComponent(searchTerm)}/biggest-trade`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setBiggestTrade(data && !data.error ? data : null))
      .catch(() => setBiggestTrade(null));

    // Fetch stats for the past 3 years
    fetch(`${apiUrl}/api/politicians/${encodeURIComponent(searchTerm)}/stats`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setStats(data && !data.error ? data : null))
      .catch(() => setStats(null));
  }, [searchTerm]);

  if (!searchTerm) {
    return (
      <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 10 }}>
        Enter a congressman's name in the search bar above to view their photo.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          <Avatar
            sx={{
              width: 110,
              height: 110,
              bgcolor: 'primary.light',
              boxShadow: 3,
              border: '3px solid',
              borderColor: 'primary.main',
              mb: 1
            }}
            src={profileData[0]}
          >
            <PersonIcon sx={{ fontSize: 110 }} />
          </Avatar>
          {profileData[1] && (
            <Typography sx={{ mt: 1.5, fontWeight: 700, fontSize: 22, letterSpacing: 0.5 }}>
              {profileData[1]}
            </Typography>
          )}
          {profileData[2] && (
            <Typography sx={{ color: 'text.secondary', fontSize: 16, mb: 1 }}>
              {profileData[2]}
            </Typography>
          )}
          {/* Stats Section */}
          {stats && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 4,
                mt: 2,
                mb: 1,
                width: '100%',
                maxWidth: 420
              }}
            >
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total Trades <span style={{ fontWeight: 400, fontSize: 13 }}>(past 3 years)</span>
                </Typography>
                <Typography variant="h6">{stats.total_trades}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Est. Spending <span style={{ fontWeight: 400, fontSize: 13 }}>(past 3 years)</span>
                </Typography>
                <Typography variant="h6">
                  ${stats.estimated_spending.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
          {/* Trades Cards */}
          <Box
            sx={{
              mt: 4,
              width: '100%',
              maxWidth: 500,
              display: 'flex',
              gap: 3,
              justifyContent: 'center'
            }}
          >
            <TradeCard trade={latestTrade} label="Most Recent" color="primary" active={!!latestTrade} />
            <TradeCard trade={biggestTrade} label="Biggest Trade" color="primary" active={!!biggestTrade} />
          </Box>
        </>
      )}
    </Box>
  );
}

export default CongressView;