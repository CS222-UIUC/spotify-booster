import React from 'react';

import { Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function TrackList() {
  const theme = useTheme();

  return (
    <Paper
      color={theme.palette.background.paper}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      elevation={5}
    ></Paper>
  );
}
