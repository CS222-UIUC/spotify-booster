// This file creates the Finder component, which is responsible for rendering
// either the search bar and search results, or the current mashup and all the
// songs in the mashup.

import { Paper } from '@mui/material';
import React, { useState } from 'react';
import ResultList from './ResultList';
import SearchHeader from './SearchHeader';
import { useTheme } from '@mui/material/styles';
import { searchSpotifyFor } from './SpotifySearch';
import { ResultType } from './util';

// Possible values for what the Finder can display.
export enum FinderView {
  SEARCH, // Display search results.
  MASHUP, // Display songs in the current mashup.
}

// TODO: remove. These are only for proof-of-concept while in development.
const testSearchResults = [
  { resultType: ResultType.TRACK, name: 'Example Song 1' },
  { resultType: ResultType.TRACK, name: 'Example Song 2' },
  { resultType: ResultType.TRACK, name: 'Example Song 3' },
];
const testMashupResults = [
  { resultType: ResultType.MASHUP, name: 'Example Mashup Song 1' },
  { resultType: ResultType.MASHUP, name: 'Example Mashup Song 2' },
  { resultType: ResultType.MASHUP, name: 'Example Mashup Song 3' },
];

function Finder() {
  const [view, setView] = useState(FinderView.SEARCH);
  const mashupID = 'Example Mashup Title';
  const [results, setResults] = useState(testSearchResults);
  const theme = useTheme();

  function handleViewChange(newView: FinderView) {
    setView(newView);
    switch (newView) {
      case FinderView.SEARCH:
        setResults(testSearchResults);
        break;
      case FinderView.MASHUP:
        setResults(testMashupResults);
        break;
      default:
    }
  }

  return (
    <Paper
      color={theme.palette.background.paper}
      sx={{
        width: '25%',
        maxHeight: 200,
        display: 'flex', // Prevent the list from overflowing.
        flexDirection: 'column',
        margin: 2,
      }}
      elevation={5}
    >
      <SearchHeader
        view={view}
        handleViewChange={handleViewChange}
        searchSpotifyCallback={searchSpotifyFor}
        mashupID={mashupID}
      />
      <ResultList results={results} />
    </Paper>
  );
}

export default Finder;