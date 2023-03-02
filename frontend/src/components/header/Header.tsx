import React from 'react';
import SpotifyLoginButton from '../login/Authorization';
import { AppBar, Toolbar } from '@mui/material';

function Header() {
  return (
    <AppBar>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        Spotify Booster
        <SpotifyLoginButton />
      </Toolbar>
    </AppBar>
  );
}

export default Header;