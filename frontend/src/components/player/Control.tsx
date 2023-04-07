/*  This file contains the entire code for the Control component.
    The Control component is a container for the music player, including the following elements:
    - album art
    - the song title/artist name
    - mash-up playing progress bar
    - mash-up playing controls (play/pause, skip, etc.)
    - mash-up remake
    */

import React, { useContext } from 'react';
import { useState, useEffect, useRef } from 'react';

import { Typography, Grid } from '@mui/material';
import { ControllerContainer, AlbumArt } from '../../theme';
import PlaybackBar from './PlaybackBar';
import { CookieContext, Result, spotifyHTTP } from '../util';

/**
 * The Control component is a container for the music player, which has the song
 * title of the current song, and the progress bar with playback controls.
 *
 * @param tracks List of tracks in the mashup.
 * @param currentTrack The index of the current track in the mashup. Null if no
 * track should be playing.
 * @param updateCurrentTrack A function to update the current track state in the
 * parent.
 */
export default function Control({
  tracks,
  currentTrack,
  updateCurrentTrack,
}: {
  tracks: Array<Result>;
  currentTrack: number | null;
  updateCurrentTrack: Function;
}) {
  // outerHeight and outerWidth are the height and width of the ControllerPaper container
  const [outerHeight, setOuterHeight] = useState(0);
  const [outerWidth, setOuterWidth] = useState(0);

  // albumColPortion is the portion of the ControllerPaper container that is allocated to the album art
  const [albumColPortion, setAlbumColPortion] = useState(0);

  // outerRef is a reference to the ControllerPaper container
  // it is for us to know the dimension of the first Grid container
  const outerRef = useRef<any>();

  // Spotify authentication token
  const cookie = useContext(CookieContext);
  spotifyHTTP.defaults.headers.common['Authorization'] = `Bearer ${cookie}`;

  // Spotify player SDK
  const [spotifyPlayer, setSpotifyPlayer] = useState<Spotify.Player | null>(
    null
  );
  // The Spotify ID for the web player. Null iff the web player is offline.
  const [deviceId, setDeviceId] = useState<string | null>(null);
  // Whether the Spotify player is ready to be configured.
  const [playerReady, setPlayerReady] = useState(false);
  // Whether music is currently not playing.
  const [paused, setPaused] = useState<boolean>(true);

  useEffect(() => {
    if (!outerRef.current) return; // wait for the elementRef to be available
    const resizeObserver = new ResizeObserver(() => {
      // The following actions will be called every time the element is resized
      setOuterHeight(outerRef.current.clientHeight);
      setOuterWidth(outerRef.current.clientWidth);
      setAlbumColPortion(
        parseFloat((((outerHeight - 32) / (outerWidth - 32)) * 100).toFixed(4))
      );
    });
    resizeObserver.observe(outerRef.current);
    return () => {
      // clean up
      resizeObserver.disconnect();
    };
  });

  // Prepare the Spotify player SDK.
  useEffect(() => {
    // Attatch the SDK.
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // Callback for when the SDK is ready.
    window.onSpotifyWebPlaybackSDKReady = () => {
      // Request player with given settings.
      const player = new window.Spotify.Player({
        // This is the name that will show up in Spotify Connect.
        name: 'Spotify Booster',
        getOAuthToken: (cb: Function) => {
          cb(cookie);
        },
        volume: 0.5,
      });

      // Store the player to be configured more later.
      setSpotifyPlayer(player);
      // Mark that the player is ready to be configured.
      setPlayerReady(true);
    };
  }, []);

  // Finish configuring the Spotify player SDK. This needs to be separate from
  // the above useEffect, because otherwise the async functions may conflict,
  // and the device will be initialized more than once.
  useEffect(() => {
    // Make sure we are ready for setup.
    if (playerReady && spotifyPlayer) {
      // Listener to store the device ID once configured.
      spotifyPlayer.addListener(
        'ready',
        ({ device_id }: { device_id: any }) => {
          console.debug('Spotify player ready with ID', device_id);
          setDeviceId(device_id);
        }
      );

      // Listener to handle if the player goes offline.
      spotifyPlayer.addListener(
        'not_ready',
        ({ device_id }: { device_id: any }) => {
          console.warn('Spotify player has gone offline', device_id);
          setDeviceId(null);
        }
      );

      // Initialize the player.
      spotifyPlayer.connect();
    }
  }, [playerReady]); // Only run this useEffect when playerReady changes.

  // Handle when the current track changes.
  useEffect(() => {
    // If we have a valid song that we can play...
    if (deviceId === null) return;
    if (currentTrack !== null) {
      // Send request to Spotify to play the song.
      spotifyHTTP.put(
        'me/player/play',
        { uris: [tracks[currentTrack].id] },
        { params: { device_id: deviceId } }
      );
      // Mark that the song is playing.
      setPaused(false);
    } else {
      spotifyHTTP.put('me/player/pause');
    }
  }, [currentTrack, spotifyPlayer]);

  /**
   * Skip to the next track. If we are at the end of the list, go back to the
   * beginning.
   */
  function nextTrack() {
    if (tracks.length !== 0 && currentTrack !== null) {
      updateCurrentTrack((currentTrack + 1) % tracks.length);
    }
  }

  /**
   * Skip to the previous track. If we are at the beginning of the list, go to
   * the end.
   */
  function prevTrack() {
    if (tracks.length !== 0 && currentTrack !== null) {
      updateCurrentTrack((currentTrack - 1 + tracks.length) % tracks.length);
    }
  }

  /**
   * Flip whether the music is playing or not. (Given that there is something to
   * be played.)
   */
  function togglePaused() {
    if (deviceId !== null && currentTrack !== null) {
      if (paused) {
        spotifyHTTP.put('me/player/play');
      } else {
        spotifyHTTP.put('me/player/pause');
      }
      setPaused(!paused);
    }
  }

  // This function returns the Control component
  // ControllerContainer -> Grid -> Grid -> Typography
  return (
    <ControllerContainer>
      <Grid container p={2} height="100%" ref={outerRef}>
        <Grid
          height="100%"
          style={{
            // the following makes sure that the album art
            // doesn't have correct display when the parent container is not loaded yet
            flex: `0 0 ${
              albumColPortion == 0 || albumColPortion == 100
                ? 0
                : albumColPortion
            }%`,
          }}
          position="relative"
        >
          <AlbumArt
            // this src is a placeholder for the album art
            // @TODO: replace with actual album art, if available from Spotify's API or elsewhere
            src="https://i.ibb.co/Y0KTnFf/a4139357031-10.jpg"
          />
        </Grid>
        <Grid
          height="100%"
          style={{ flex: `0 0 ${100 - albumColPortion}%` }}
          sx={{ paddingLeft: 2 }}
        >
          <Typography variant="h6">
            {currentTrack !== null
              ? tracks[currentTrack].name
              : 'No Song Selected'}
          </Typography>
          <Typography variant="subtitle1">Artist Name</Typography>

          <PlaybackBar
            prevTrack={prevTrack}
            nextTrack={nextTrack}
            paused={paused}
            togglePaused={togglePaused}
          />
        </Grid>
      </Grid>
    </ControllerContainer>
  );
}
