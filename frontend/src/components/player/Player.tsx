// This file contains the entire code for the Player component.
// It is a container for the Control and TrackList components.

import React, { useEffect, useState } from 'react';

import { Grid } from '@mui/material';
import Control from './Control';
import TrackList from './TrackList';
import {
  MashupInCreation,
  Result,
  ResultType,
  TrackInfo,
  backendHTTP,
} from '../util';

function convertBackendTrackList(response: any): Array<Result> {
  // TODO
  console.log(response.data.tracks);
  // Temporary for testing
  return [
    {
      resultType: ResultType.Track,
      id: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
      name: 'Blinding Lights',
    },
    {
      resultType: ResultType.Track,
      id: 'spotify:track:7qiZfU4dY1lWllzX7mPBI3',
      name: 'Shape of You',
    },
    {
      resultType: ResultType.Track,
      id: 'spotify:track:2XU0oxnq2qxCpomAAuJY8K',
      name: 'Dance Monkey',
    },
  ];
}

async function getTracksInMashup(mashup: Result): Promise<Array<Result>> {
  if (mashup.resultType !== ResultType.Mashup || mashup === MashupInCreation)
    return [];

  try {
    return await backendHTTP
      .get('mashupapi/getMashupTracks', {
        params: { mashup_id: mashup.id },
      })
      .then((response) => convertBackendTrackList(response));
  } catch (error) {
    console.error(error);
  }
  return [];
}

export default function Player({ mashup }: { mashup: Result }) {
  // The list of songs in a mashup.
  const [tracks, setTracks] = useState<Array<Result>>([]);

  // The current song that should be playing.
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);

  useEffect(() => {
    getTracksInMashup(mashup).then((tracks) => {
      if (tracks.length !== 0) setCurrentTrack(0);
      else setCurrentTrack(null);
      setTracks(tracks);
    });
  }, [mashup]);

  return (
    <Grid container style={{ height: '100%' }}>
      <Grid item xs={12} sx={{ paddingBottom: 2 }} style={{ height: '20%' }}>
        <Control
          tracks={tracks}
          currentTrack={currentTrack}
          updateCurrentTrack={setCurrentTrack}
        />
      </Grid>
      <Grid item xs={12} style={{ height: '80%' }}>
        <TrackList tracks={tracks} currentTrack={currentTrack} />
      </Grid>
    </Grid>
  );
}
