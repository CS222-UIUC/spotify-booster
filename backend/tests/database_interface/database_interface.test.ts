import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';

import DatabaseInterface from '../../src/database_interface/database_interface';
import { arrays_match_unordered } from './track_db_interface.test';

const TEMP_FILE_DIRECTORY = path.join(__dirname, 'test_databases');

// ensure empty temporary directory exists before running tests
before(async () => {
  try {
    fs.mkdirSync(TEMP_FILE_DIRECTORY, { recursive: true });
    fs.emptyDirSync(TEMP_FILE_DIRECTORY);
  } catch {
    /* */
  }
});

// delete temporary directory after running tests
after(async () => {
  try {
    fs.rmSync(TEMP_FILE_DIRECTORY, { recursive: true, force: true });
  } catch {
    /* */
  }
});

// Returns a unique string each time to be used as a database name
function unique_database_name() {
  return `Database-Test-${Date.now()}.db`;
}

describe('New Database Interface Initialization', () => {
  it('creates a new database at given location', (done) => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());

    const db = new DatabaseInterface(db_location);

    setTimeout(async () => {
      assert(
        fs.existsSync(db_location),
        'Database was not created at expected location'
      );

      assert((await db.remixCount()) === 0, 'Creates empty remix tabe');
      assert((await db.totalTrackCount()) === 0, 'Creates empty track tabe');

      await db.close();
      done();
    }, 500);
  });
});

describe('Existing Database Initialization', () => {
  it('opens an existing database and finds existing tracks and remixes', async () => {
    const db_location = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'tests',
      'database_interface',
      'database_interface.test.db'
    );
    const db = new DatabaseInterface(db_location);

    const id0 = 'WeWkXbxl7OQXyqAImuOdHBnI+lgKbvr+jI1t0JJ5xTo=';
    const name0 = 'remix_0';
    const remix0_tracks = [
      { track_id: 'spotify_track_0', start_ms: 11, end_ms: 22 },
      { track_id: 'spotify_track_1', start_ms: 10, end_ms: 20 },
      { track_id: 'spotify_track_2', start_ms: 9, end_ms: 18 },
      { track_id: 'spotify_track_3', start_ms: 8, end_ms: 16 },
    ];
    const id1 = 'EeaNp8zxcWNhIUSWB11RgmTVFTWKzQWhWbifslF/JCY=';
    const name1 = 'remix_1';
    const remix1_tracks = [
      { track_id: 'spotify_track_0', start_ms: 7, end_ms: 14 },
      { track_id: 'spotify_track_2', start_ms: 6, end_ms: 12 },
      { track_id: 'spotify_track_4', start_ms: 5, end_ms: 10 },
      { track_id: 'spotify_track_6', start_ms: 4, end_ms: 8 },
    ];
    const id2 = 'ZDcGdnwaORyeNmrFLeJvhc78pIHNCLSMJOZ5vaBQBjE=';
    const name2 = 'remix_2';
    const remix2_tracks = [
      { track_id: 'spotify_track_0', start_ms: 3, end_ms: 6 },
      { track_id: 'spotify_track_3', start_ms: 2, end_ms: 4 },
      { track_id: 'spotify_track_6', start_ms: 1, end_ms: 2 },
      { track_id: 'spotify_track_9', start_ms: 0, end_ms: -1 },
    ];

    assert((await db.remixCount()) === 3, 'Database contains 3 remixes');
    assert((await db.totalTrackCount()) === 12, 'Database contains 12 tracks');
    assert((await db.getRemixName(id0)) === name0, 'Remix 0 has correct name');
    assert((await db.getRemixName(id1)) === name1, 'Remix 1 has correct name');
    assert((await db.getRemixName(id2)) === name2, 'Remix 2 has correct name');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id2), remix2_tracks),
      'Remix 2 contains expected tracks'
    );

    await db.close();
  });
});
