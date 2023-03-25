import React from 'react';
import { useState, useEffect, useRef } from 'react';

import { Typography, Grid } from '@mui/material';
import { Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function Control() {
  const theme = useTheme();

  const [outerHeight, setOuterHeight] = useState(0);
  const [outerWidth, setOuterWidth] = useState(0);
  const [albumColPortion, setAlbumColPortion] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const outerRef = useRef<any>();

  useEffect(() => {
    if (!outerRef.current) return; // wait for the elementRef to be available
    const resizeObserver = new ResizeObserver(() => {
      // Do what you want to do when the size of the element changes
      setOuterHeight(outerRef.current.clientHeight);
      setOuterWidth(outerRef.current.clientWidth);
      setAlbumColPortion(
        parseFloat((((outerHeight - 32) / (outerWidth - 32)) * 100).toFixed(4))
      );
      //   console.log(albumColPortion);
    });
    resizeObserver.observe(outerRef.current);
    return () => {
      // clean up
      resizeObserver.disconnect();
    };
  });

  return (
    <Paper
      color={theme.palette.background.paper}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
      }}
      elevation={5}
    >
      <Grid container p={2} height="100%" ref={outerRef}>
        <Grid
          height="100%"
          style={{
            flex: `0 0 ${
              albumColPortion == 0 || albumColPortion == 100
                ? 0
                : albumColPortion
            }%`,
          }}
          position="relative"
        >
          <img
            src="https://i.ibb.co/Y0KTnFf/a4139357031-10.jpg"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              objectFit: 'cover',
            }}
          />
        </Grid>
        <Grid
          height="100%"
          style={{
            flex: `0 0 ${100 - albumColPortion}%`,
          }}
          sx={{
            paddingLeft: 2,
          }}
        >
          <Typography variant="h6">Song Title</Typography>
          <Typography variant="subtitle1">Artist Name</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
