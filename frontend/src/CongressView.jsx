import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import CircularProgress from '@mui/material/CircularProgress';

// Get API URL from environment variable
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function CongressView({ searchTerm }) {
  const [profileData, setProfileData] = useState([null, '', '']); // [img, name, family]
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
      setProfileData([null, '', '']);
      return;
    }
    setIsLoading(true);
    setProfileData([null, '', '']);
    fetch(`${apiUrl}/api/pol/image?name=${encodeURIComponent(searchTerm)}`)
      .then(res => res.json())
      .then(data => {
        // Expecting backend to return: { img, politician_name, politician_family }
        const imgUrl = data.img ? `https://www.capitoltrades.com${data.img}` : null;
        setProfileData([imgUrl, data.politician_name || '', data.politician_family || '']);
        setIsLoading(false);
      })
      .catch(() => {
        setProfileData([null, '', '']);
        setIsLoading(false);
      });
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
            sx={{ width: 100, height: 100, bgcolor: 'primary.light' }}
            src={profileData[0]}
          >
            <PersonIcon sx={{ fontSize: 100 }} />
          </Avatar>
          {profileData[1] && (
            <Typography sx={{ mt: 2, fontWeight: 'bold' }}>
              {profileData[1]}
            </Typography>
          )}
          {profileData[2] && (
            <Typography sx={{ color: 'text.secondary' }}>
              {profileData[2]}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}

export default CongressView;