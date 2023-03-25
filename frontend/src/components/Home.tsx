import React from 'react';
import { useState, useEffect } from 'react';

import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import GlobalStyles from '@mui/material/GlobalStyles';
import '../App.scss';

import Header from './Header';
import Finder from './finder/Finder';
import { getCookie } from '../components/login/Cookie';

function Home() {
  const cookie = getCookie('spotify_access_token');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = cookie != null;
    setIsLoggedIn(loggedIn);
  });

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles
        styles={{
          body: { backgroundColor: theme.palette.background.default },
        }}
      ></GlobalStyles>
      <Header />
      {isLoggedIn && <Finder />}
    </ThemeProvider>
  );
}

export default Home;
