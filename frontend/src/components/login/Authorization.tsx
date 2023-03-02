import { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

const SpotifyLoginButton: React.FC = () => {
  const [token, setToken] = useState<string | null>(getCookie('spotify_access_token'));

  const handleLogin = async () => {
    const clientId = '01e902e599d7467494c373c6873781ad';
    const redirectUri = 'http://localhost:3000'; // Your redirect URI

    const scopes = 'user-read-email user-library-read';
    const state = Math.random().toString(36).substring(7); // Generate a random state value

    const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    window.location.href = url;
  };

  const handleLogout = () => {
    setToken(null);
    spotifyApi.setAccessToken(null);
    setCookie('spotify_access_token', '', -1); // Set the access token in a cookie that expires immediately
  };

  const [user, setUser] = useState<any>(null);

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


  const handleRedirect = async () => {
    const redirectUri = 'http://localhost:3000'; // Your redirect URI

    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      // Exchange the authorization code for an access token
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa('01e902e599d7467494c373c6873781ad:4990665be4f148d696cc5143ca4f84e4')}`
        },
        body: new URLSearchParams({
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': redirectUri
        })
      });
      const data = await response.json();
      setToken(data.access_token);
      spotifyApi.setAccessToken(data.access_token);
      setCookie('spotify_access_token', data.access_token, 7); // Set the access token in a cookie that expires in 7 days
      window.history.replaceState(null, '', redirectUri); // Remove the query parameters from the URL
    }
  };

  useEffect(() => {
    handleRedirect();
  }, []);

  return (
    <div>
      {/* Welcome, {user.display_name}! */}
      {!token && <button onClick={handleLogin}>Login with Spotify</button>}
      {token && <button onClick={handleLogout}> Logout</button>}
    </div>
  );
};

export default SpotifyLoginButton;

function getCookie(name: string) {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = '; expires=' + date.toUTCString();
  document.cookie = name + '=' + value + expires + '; path=/';
}