import React from 'react';

import { Grid } from '@mui/material';
import Control from './Control';
import TrackList from './TrackList';

export default function Player() {
  return (
    <Grid container style={{ height: '100%' }}>
      <Grid item xs={12} sx={{ paddingBottom: 2 }} style={{ height: '20%' }}>
        <Control />
      </Grid>
      <Grid item xs={12} style={{ height: '80%' }}>
        <TrackList />
      </Grid>
    </Grid>
  );
}
