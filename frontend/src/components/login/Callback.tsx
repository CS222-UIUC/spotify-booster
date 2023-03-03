import React from 'react';
import { useState, useEffect } from 'react';
import { getCookie, setCookie } from './Cookie';
import { useNavigate } from 'react-router-dom';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

const Callback: React.FC = () => {
    let isRequestSent = false; // Call the Spoitfy API only once

    const [token, setToken] = useState<string | null>(getCookie('spotify_access_token'));
    const navigate = useNavigate();

    const handleRedirect = async () => {
        // Detect whether the URL is local environment or on remove server (e.g., on Vercel)
        const redirectUri = (window.location.hostname == 'localhost') ?
            'http://localhost:3000/callback' : 'https://' + window.location.hostname + 'callback';

        alert(redirectUri);

        // Store code and state for later use on Spotify API
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (code && state && !isRequestSent) {
            // Exchange the authorization code for an access token
            isRequestSent = true;
            try {
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
                if (data.access_token != null) {
                    setToken(data.access_token);

                    // Set the access token in a cookie that expires in 7 days
                    spotifyApi.setAccessToken(data.access_token);
                    setCookie('spotify_access_token', data.access_token, 7);

                    // Remove the query parameters from the URL
                    window.history.replaceState(null, '', redirectUri);
                }
                navigate("/");
            } catch (error) {
                navigate("/");
                // @TODO: handle request error, e.g., add a backdrop to prompt use about the failed logging.
            }
        }
    };

    useEffect(() => {
        handleRedirect();
    }, []);

    return null;
}

export default Callback;