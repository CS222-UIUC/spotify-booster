import SpotifyLogin from '../login/Authorization';
import { AppBar, Link, Toolbar } from '@mui/material';

function Header() {
  return (
    <AppBar>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/" underline="none" color="secondary"><b>Spotify Booster</b></Link>
        <SpotifyLogin />
      </Toolbar>
    </AppBar>
  );
}

export default Header;