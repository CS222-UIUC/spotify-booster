import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { getCookie, setCookie } from './Cookie';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

const SpotifyLogin: React.FC = () => {
  const [token, setToken] = useState<string | null>(getCookie('spotify_access_token'));
  const [user, setUser] = useState<any>(null);

  const handleLogin = async () => {
    const clientId = '01e902e599d7467494c373c6873781ad';

    // Detect whether the URL is local environment or on remove server (e.g., on Vercel)
    const redirectUri = (window.location.hostname == 'localhost') ?
      'http://localhost:3000/callback' : 'https://' + window.location.hostname + 'callback';

    const scopes = 'user-read-email user-library-read user-read-playback-position';
    const state = Math.random().toString(36).substring(7);
    const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&
      scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    window.location.href = url;
  };

  const handleLogout = () => {
    setToken(null);
    spotifyApi.setAccessToken(null);
    setCookie('spotify_access_token', '', -1); // Set the access token in a cookie that expires immediately
    window.location.reload();
  };

  useEffect(() => {
    const getUserProfile = async () => {
      const response = await spotifyApi.getMe();
      setUser(response);
    };

    if (token) {
      spotifyApi.setAccessToken(token);
      getUserProfile();
    }
  }, [token]);

  return (
    <div>
      {/* Detects whether user has logged in or not */}
      {user && token && <Button variant="contained">Welcome, {user.display_name}!</Button>}
      {!token && <Button variant="contained" color="secondary" onClick={handleLogin}>Login with Spotify</Button>}
      {token && <Button variant="contained" color="secondary" onClick={handleLogout}> Logout</Button>}
    </div>
  );
};

export default SpotifyLogin;