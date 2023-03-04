import React from 'react';

import '../App.scss';
import { theme } from '../theme';
import { ThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';

import Header from './Header';

export default function Home() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles
        styles={{
          body: { backgroundColor: theme.palette.background.default },
        }}
      ></GlobalStyles>
      <Header />
    </ThemeProvider>
  );
}
