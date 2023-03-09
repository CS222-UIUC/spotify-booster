import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

import DatabaseInterface from './database_interface';

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

// Compares 2 arrays and returns true if they contain the same elements in any order
function arrays_match_unordered(a: Array<unknown>, b: Array<unknown>): boolean {
  for (let i = 0; i < a.length; i++) {
    let found = false;
    for (let j = 0; j < b.length; j++) {
      if (a[i] === b[j]) found = true;
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
      'some_spotify_id0',
      'some_spotify_id1',
      'some_spotify_id2',
      'some_spotify_id3',
    ];
    const remix1_tracks = [
      'some_spotify_id0',
      'some_spotify_id2',
      'some_spotify_id4',
      'some_spotify_id6',
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track);
    for (const track of remix1_tracks) await db.addTrack(id1, track);

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
      'some_spotify_id0',
      'some_spotify_id1',
      'some_spotify_id2',
      'some_spotify_id3',
    ];
    const remix1_tracks = [
      'some_spotify_id0',
      'some_spotify_id2',
      'some_spotify_id4',
      'some_spotify_id6',
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track);
    for (const track of remix1_tracks) await db.addTrack(id1, track);

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
      try {
        await db.addTrack(invalid, 'some_spotify_id10');
        assert.fail('Invalid remix id did not cause error');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Invalid Remix Id');
      }
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
      'some_spotify_id0',
      'some_spotify_id1',
      'some_spotify_id2',
      'some_spotify_id3',
    ];
    const remix1_tracks = [
      'some_spotify_id0',
      'some_spotify_id2',
      'some_spotify_id4',
      'some_spotify_id6',
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track);
    for (const track of remix1_tracks) await db.addTrack(id1, track);

    try {
      await db.addTrack(id0, '');
      assert.fail('Invalid remix id did not cause error');
    } catch (error) {
      assert.throws(() => {
        throw error;
      }, 'Invalid Track Id');
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

  it('rejects promise if creating a track that that is already in the remix', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      'some_spotify_id0',
      'some_spotify_id1',
      'some_spotify_id2',
      'some_spotify_id3',
    ];
    const remix1_tracks = [
      'some_spotify_id0',
      'some_spotify_id2',
      'some_spotify_id4',
      'some_spotify_id6',
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track);
    for (const track of remix1_tracks) await db.addTrack(id1, track);

    try {
      await db.addTrack(id0, 'some_spotify_id0');
      assert.fail('Invalid remix id did not cause error');
    } catch (error) {
      assert.throws(() => {
        throw error;
      }, 'Track Id Exists In Remix');
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

describe('Removing Tracks', () => {
  it('removes a track with valid ids', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');
    const remix0_tracks = [
      'some_spotify_id0',
      'some_spotify_id1',
      'some_spotify_id2',
      'some_spotify_id3',
    ];
    const remix1_tracks = [
      'some_spotify_id0',
      'some_spotify_id2',
      'some_spotify_id4',
      'some_spotify_id6',
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track);
    for (const track of remix1_tracks) await db.addTrack(id1, track);

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
      'some_spotify_id0',
      'some_spotify_id1',
      'some_spotify_id2',
      'some_spotify_id3',
    ];
    const remix1_tracks = [
      'some_spotify_id0',
      'some_spotify_id2',
      'some_spotify_id4',
      'some_spotify_id6',
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track);
    for (const track of remix1_tracks) await db.addTrack(id1, track);

    const invalid_ids = [
      '', // blank
      '\n',
      ' ',
      's0me_spotify_id0', // similar
    ];
    for (const id of invalid_ids) {
      try {
        await db.removeTrack(id0, id);
        assert.fail('Invalid track id did not cause error');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Invalid Track Id');
      }
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
      'some_spotify_id0',
      'some_spotify_id1',
      'some_spotify_id2',
      'some_spotify_id3',
    ];
    const remix1_tracks = [
      'some_spotify_id0',
      'some_spotify_id2',
      'some_spotify_id4',
      'some_spotify_id6',
    ];
    for (const track of remix0_tracks) await db.addTrack(id0, track);
    for (const track of remix1_tracks) await db.addTrack(id1, track);

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
      try {
        await db.removeTrack(id, 'some_spotify_id0');
        assert.fail('Invalid remix id did not cause error');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Invalid Remix Id');
      }
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
