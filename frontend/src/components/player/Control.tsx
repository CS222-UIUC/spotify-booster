/*  This file contains the entire code for the Control component.
    The Control component is a container for the music player, including the following elements:
    - album art
    - the song title/artist name
    - mash-up playing progress bar
    - mash-up playing controls (play/pause, skip, etc.)
    - mash-up remake
*/

import React from 'react';
import { useState, useEffect, useRef } from 'react';

import { Typography, Grid } from '@mui/material';
import { ControllerContainer, AlbumArt } from '../../theme';

export default function Control() {
  // outerHeight and outerWidth are the height and width of the ControllerPaper container
  const [outerHeight, setOuterHeight] = useState(0);
  const [outerWidth, setOuterWidth] = useState(0);

  // albumColPortion is the portion of the ControllerPaper container that is allocated to the album art
  const [albumColPortion, setAlbumColPortion] = useState(0);

  // outerRef is a reference to the ControllerPaper container
  // it is for us to know the dimension of the first Grid container
  const outerRef = useRef<any>();

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
          <Typography variant="h6">Song Title</Typography>
          <Typography variant="subtitle1">Artist Name</Typography>
        </Grid>
      </Grid>
    </ControllerContainer>
  );
}
