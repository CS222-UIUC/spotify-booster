import React from 'react';

import { useEffect } from 'react';
import { setCookie } from './Cookie';
import { useNavigate } from 'react-router-dom';

import querystring from 'querystring';
import SpotifyWebApi from 'spotify-web-api-js';
import spotify_config from '../../config/spotify_config';

const spotifyApi = new SpotifyWebApi();

const Callback: React.FC = () => {
  let isRequestSent = false; // Make sure to call the Spoitfy API only once

  const navigate = useNavigate(); // Initiate `useNavigate()`

  const handleRedirect = async () => {
    // Detect whether the URL is local environment or on remove server (e.g., on Vercel)
    const redirectUri =
      window.location.hostname === 'localhost'
        ? 'http://localhost:3000/callback'
        : 'https://' + window.location.hostname + '/callback';

    // Store code and state for later use on Spotify API
    const query = querystring.parse(window.location.search.slice(1));
    const code = query.code;
    const state = query.state;

    // Make sure the request is only sent once
    if (code && state && !isRequestSent) {
      // Exchange the authorization code for an access token
      isRequestSent = true;
      try {
        // Request token from Spotify API
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(
              spotify_config.clientId + ':' + spotify_config.clientSec
            )}`,
          },
          body: querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
          }),
        });

        const data = await response.json();
        if (data.access_token !== null) {
          // Set the access token in a cookie that expires in 7 days
          spotifyApi.setAccessToken(data.access_token);
          // Set cookie
          setCookie('spotify_access_token', data.access_token, 7);

          // Remove the query parameters from the URL
          window.history.replaceState(null, '', redirectUri);
        }
      } catch (error) {
        console.log('Spotify API request: ', error);
      }
      navigate('/');
    }
  };

  useEffect(() => {
    handleRedirect();
  }, []);

  return null;
};

export default Callback;
