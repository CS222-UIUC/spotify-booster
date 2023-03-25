import React from 'react';

import { Box, Typography } from '@mui/material';

export default function Splash() {
  return (
    <Box
      sx={{
        height: '90vh', // Set background height to fill the viewport
        display: 'flex', // Use flexbox to align content
        justifyContent: 'center', // Center content horizontally
        alignItems: 'center', // Center content vertically
        backgroundColor: 'primary.secondary', // Set background color
      }}
    >
      <Typography
        variant="h3"
        color="secondary"
        sx={{
          fontWeight: 'bold',
          position: 'relative', // Set position to relative to stack on top of the overlay
          zIndex: 1, // Set a higher zIndex to make sure the text is displayed above the overlay
        }}
      >
        Create mash-up with your Spotify favorites
      </Typography>
    </Box>
  );
}
