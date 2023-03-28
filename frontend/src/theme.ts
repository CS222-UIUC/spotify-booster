// This file is used to define the theme for the app
// Including some custom UI components

import { createTheme, styled } from '@mui/material/styles';
import { Paper } from '@mui/material';

export const theme = createTheme({
  palette: {
    // force dark mode
    mode: 'dark',
    secondary: {
      main: '#1cd760', // green
    },
  },
});

export const ControllerContainer = styled(Paper)(({ theme }) => ({
  // backgroundColor: theme.palette.background.paper,
  width: '100%',
  height: '100%',
  display: 'flex',
  elevation: 5,
}));

export const TrackListContainer = styled(Paper)(({ theme }) => ({
  // backgroundColor: theme.palette.background.paper,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  elevation: 5,
}));

export const AlbumArt = styled('img')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  width: '100%',
  height: '100%',
  display: 'flex',
  elevation: 5,
}));
