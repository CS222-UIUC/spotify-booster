import React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { getCookie, setCookie } from './Cookie';

import SpotifyWebApi from 'spotify-web-api-js';
import spotify_config from '../../config/spotify_config';

const spotifyApi = new SpotifyWebApi();

const SpotifyLogin: React.FC = () => {
  let isRequestSentGetProfile = false; // Call the Spoitfy API only once

  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [token, setToken] = useState<string | null>(
    getCookie('spotify_access_token')
  );

  // Handle login behavior
  const handleLogin = async () => {
    // Detect whether the URL is local environment or on remove server (e.g., on Vercel)
    const redirectUri =
      window.location.hostname === 'localhost'
        ? 'http://localhost:3000/callback'
        : 'https://' + window.location.hostname + '/callback';

    const scopes = spotify_config.scopes;
    const state = Math.random().toString(36).substring(7);
    const url = `${spotify_config.authorizeUrlPrefix}&client_id=${
      spotify_config.clientId
    }&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}`;

    // Redirect to the URL
    window.location.href = url;
  };

  // Handle logout behavior
  const handleLogout = () => {
    setToken(null);
    spotifyApi.setAccessToken(null);

    // Set the access token in a cookie that expires immediately
    setCookie('spotify_access_token', '', -1);
    window.location.reload();
  };

  // Getting user profile
  useEffect(() => {
    const getUserProfile = async () => {
      const response = await spotifyApi.getMe();
      setUser(response);
    };

    if (token) {
      if (!isRequestSentGetProfile) {
        spotifyApi.setAccessToken(token);
        getUserProfile();
        isRequestSentGetProfile = true;
      }
    }
  }, [token]);

  // Setting user's display name
  useEffect(() => {
    if (user) {
      setUserName(user.display_name);
    }
  }, [user]);

  /* Detects whether user has logged in or not */
  return (
    <div>
      {user && token && (
        <Button variant="contained">Welcome, {userName}!</Button>
      )}
      {!token && (
        <Button variant="contained" color="secondary" onClick={handleLogin}>
          Login with Spotify
        </Button>
      )}
      {token && (
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      )}
    </div>
  );
};

export default SpotifyLogin;
