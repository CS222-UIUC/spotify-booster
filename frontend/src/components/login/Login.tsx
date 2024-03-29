import React, { useContext } from 'react';

import { useState, useEffect } from 'react';
import { Button, Typography } from '@mui/material';
import { setCookie } from './Cookie';
import { checkTokenExpiration } from './Requests';

import SpotifyWebApi from 'spotify-web-api-js';
import spotify_config from '../../config/spotify_config';
import { AccessTokenContext } from '../util';

const spotifyApi = new SpotifyWebApi();

const SpotifyLogin: React.FC = () => {
  let isRequestSentGetProfile = false; // Call the Spoitfy API only once

  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const { token, setToken } = useContext(AccessTokenContext);

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
        setToken(token);
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

    // Check token expiration every 5 minutes
    const intervalId = setInterval(checkTokenExpiration, 1 * 60 * 1000);

    // Clear the interval when the component is unmounted or the user object changes
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  /* Detects whether user has logged in or not */
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      {user && token && (
        <Typography style={{ marginRight: 15 }}>
          Welcome, {userName}!
        </Typography>
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
