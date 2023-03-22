// Component for the list shown in the finder.

import { List, ListItem, ListItemText } from '@mui/material';
import React from 'react';
import { Result } from './util';

// Used for rendering each result.
function renderResult(result: Result): JSX.Element {
  return (
    <ListItem key={result.id}>
      <ListItemText>{result.name}</ListItemText>
    </ListItem>
  );
}

function ResultList({ results }: { results: Array<Result> }) {
  console.log('Results: ', results);
  return (
    <div
      style={{
        overflowY: 'auto', // scroll on overflow
      }}
    >
      <List>{results.map((result) => renderResult(result))}</List>
    </div>
  );
}

export default ResultList;
