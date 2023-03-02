import React from 'react';
import SpotifyLoginGroup from '../login/Authorization';
import { AppBar, Toolbar } from '@mui/material';

function Header() {
  return (
    <AppBar>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <b>Spotify Booster</b>
        <SpotifyLoginGroup />
      </Toolbar>
    </AppBar>
  );
}

export default Header;