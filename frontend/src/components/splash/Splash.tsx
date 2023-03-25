import React from 'react';

import { Box, Typography } from '@mui/material';

export default function Splash() {
  return (
    <Box
      sx={{
        height: '90vh', // Set background height to fill the viewport
        display: 'flex', // Use flexbox to align content
        flexDirection: 'column', // Stack content vertically
        justifyContent: 'center', // Center content horizontally
        alignItems: 'center', // Center content vertically
        color: 'secondary.main',
      }}
    >
      <Typography
        variant="h2"
        sx={{
          fontWeight: 'bold',
        }}
        gutterBottom
      >
        Create mash-up with your Spotify favorites
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold',
        }}
      >
        Log in with your Spotify account to get started
      </Typography>
    </Box>
  );
}
