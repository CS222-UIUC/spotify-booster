import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

import DatabaseInterface from '../../src/database_interface/database_interface';
import { TrackInfo } from '../../src/database_interface/track_db_interface';

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

// Compares 2 arrays of tracks and returns true if they contain the same elements in any order
export function arrays_match_unordered(
  a: Array<TrackInfo>,
  b: Array<TrackInfo>
): boolean {
  for (let i = 0; i < a.length; i++) {
    let found = false;
    for (let j = 0; j < b.length; j++) {
      if (
        a[i].track_id === b[j].track_id &&
        a[i].start_ms === b[j].start_ms &&
        a[i].end_ms === b[j].end_ms
      ) {
        found = true;
      }
    }

    if (!found) return false;
  }
  return a.length === b.length;
}

describe('Creating Tracks', () => {
  it('creates a track with valid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track.track_id);
    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    assert((await db.totalTrackCount()) === 8, 'Database contains 8 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });

  it('rejects promise if creating a track with invalid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track.track_id);
    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    const invalid_ids = [
      '', // blank
      '\n',
      ' ',
      '%', // invalid base64 characters
      '!',
      '=!',
      'asdf', // too short
      id0 + 'a', // similar to existing id
      'a' + id0,
      id0 + id1,
      crypto.createHash('sha256').update((100).toString()).digest('base64'), // correct format but non existing id
    ];
    for (const invalid of invalid_ids) {
      await assert.isRejected(
        db.addTrack(invalid, 'some_spotify_id10'),
        'Invalid Remix Id'
      );
    }

    assert((await db.totalTrackCount()) === 8, 'Database contains 8 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });

  it('rejects promise if creating a track with blank track id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track.track_id);
    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    await assert.isRejected(db.addTrack(id0, ''), 'Invalid Track Id');

    assert((await db.totalTrackCount()) === 8, 'Database contains 8 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });

  it('rejects promise if creating a track that that is already in the remix', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track.track_id);
    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    await assert.isRejected(
      db.addTrack(id0, 'some_spotify_id0'),
      'Track Id Exists In Remix'
    );

    assert((await db.totalTrackCount()) === 8, 'Database contains 8 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });
});

describe('Removing Tracks', () => {
  it('removes a track with valid ids', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track.track_id);
    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    await db.removeTrack(id0, 'some_spotify_id0');
    remix0_tracks.splice(0, 1);
    await db.removeTrack(id1, 'some_spotify_id4');
    remix1_tracks.splice(2, 1);

    assert((await db.totalTrackCount()) === 6, 'Database contains 6 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });

  it('rejects promise if removing track with invalid track id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track.track_id);
    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    const invalid_ids = [
      '', // blank
      '\n',
      ' ',
      's0me_spotify_id0', // similar
    ];
    for (const id of invalid_ids) {
      await assert.isRejected(db.removeTrack(id0, id), 'Invalid Track Id');
    }

    assert((await db.totalTrackCount()) === 8, 'Database contains 8 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });

  it('rejects promise if removing track with invalid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track.track_id);
    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    const invalid_ids = [
      '', // blank
      '\n',
      ' ',
      '%', // invalid base64 characters
      '!',
      '=!',
      'asdf', // too short
      id0 + 'a', // similar to existing id
      'a' + id0,
      id0 + id1,
      crypto.createHash('sha256').update((100).toString()).digest('base64'), // correct format but non existing id
    ];
    for (const id of invalid_ids) {
      await assert.isRejected(
        db.removeTrack(id, 'some_spotify_id0'),
        'Invalid Remix Id'
      );
    }

    assert((await db.totalTrackCount()) === 8, 'Database contains 8 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });
});

describe('Track start/stop Data', () => {
  it('Sets correct default start and stop time', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');

    const expected = { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 };
    await db.addTrack(id0, expected.track_id);

    assert.deepEqual(
      await db.getRemixTracks(id0),
      [expected],
      'Sets correct defaults'
    );

    await db.close();
  });

  it('Updates start and end data', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 10, end_ms: 0 },
      { track_id: 'some_spotify_id2', start_ms: 20, end_ms: 19 },
      { track_id: 'some_spotify_id3', start_ms: 100, end_ms: 100 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) {
      await db.addTrack(id0, track.track_id);
      await db.setStartMS(id0, track.track_id, track.start_ms);
      await db.setEndMS(id0, track.track_id, track.end_ms);
    }

    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    assert((await db.totalTrackCount()) === 8, 'Database contains 8 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });

  it('rejects invalid start and end data', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track.track_id);
    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    await assert.isRejected(
      db.setStartMS(id0, remix0_tracks[0].track_id, -1),
      'start_ms cannot be negative'
    );
    await assert.isRejected(
      db.setStartMS(id0, remix0_tracks[0].track_id, -10),
      'start_ms cannot be negative'
    );
    await assert.isRejected(
      db.setStartMS(id0, remix0_tracks[0].track_id, -20),
      'start_ms cannot be negative'
    );
    await assert.isRejected(
      db.setEndMS(id0, remix0_tracks[0].track_id, -2),
      'end_ms cannot be less than -1'
    );
    await assert.isRejected(
      db.setEndMS(id0, remix0_tracks[0].track_id, -10),
      'end_ms cannot be less than -1'
    );
    await assert.isRejected(
      db.setEndMS(id0, remix0_tracks[0].track_id, -20),
      'end_ms cannot be less than -1'
    );

    assert((await db.totalTrackCount()) === 8, 'Database contains 8 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });

  it('rejects invalid track or remix id when setting start of stop data', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    const remix1_tracks = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track.track_id);
    for (const track of remix1_tracks) await db.addTrack(id1, track.track_id);

    const unknown_remix = 'some_remix';
    await assert.isRejected(
      db.setStartMS(unknown_remix, remix0_tracks[0].track_id, 0),
      'Invalid Remix Id'
    );
    await assert.isRejected(
      db.setEndMS(unknown_remix, remix0_tracks[0].track_id, 0),
      'Invalid Remix Id'
    );
    await assert.isRejected(
      db.setStartMS(id0, remix1_tracks[3].track_id, 0),
      'Invalid Track Id'
    );
    await assert.isRejected(
      db.setEndMS(id0, remix1_tracks[3].track_id, 0),
      'Invalid Track Id'
    );

    assert((await db.totalTrackCount()) === 8, 'Database contains 8 tracks');
    assert(
      arrays_match_unordered(await db.getRemixTracks(id0), remix0_tracks),
      'Remix 0 contains expected tracks'
    );
    assert(
      arrays_match_unordered(await db.getRemixTracks(id1), remix1_tracks),
      'Remix 1 contains expected tracks'
    );
    await db.close();
  });
});
