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
let id = 0;
function unique_database_name() {
  return `Database-Test-${id++}.db`;
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

describe('Creating Remixes', () => {
  it('creates a new remix with a unique id and given name and trims name', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);

    const id0 = await db.createRemix('test_remix');
    const id1 = await db.createRemix(' test_remix ');

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(id0 !== id1, 'Remix ids are unique');
    assert(
      (await db.getRemixName(id0)) === 'test_remix',
      'Database contains new remix 0'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix',
      'Database contains new remix 1'
    );

    await db.close();
  });

  it('rejects blank remix name when creating remix', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);

    const invalid_names = [
      '', // blank
      null, // null
      ' ', // whitespace
      '\n',
      '\t',
      '\r',
    ];
    for (const name of invalid_names) {
      try {
        await db.createRemix(name);
        assert.fail('Invalid remix name did not cause error');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Invalid Remix Name');
      }
    }

    assert((await db.remixCount()) === 0, 'Creates exactly 0 remixes');
    await db.close();
  });

  it('rejects promise if getting name of invalid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

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
        await db.getRemixName(invalid);
        assert.fail('Invalid remix id did not cause error');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Invalid Remix Id');
      }
    }

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(
      (await db.getRemixName(id0)) === 'test_remix0',
      'Does not update other remixes'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not update other remixes'
    );
    await db.close();
  });
});

describe('Editing Remixes', () => {
  it('updates name of valid remix id with trimmed name', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    await db.setRemixName(id0, ' new_name ');

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(
      (await db.getRemixName(id0)) === 'new_name',
      'Updates remix name with new name'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not update other remixes'
    );
    await db.close();
  });

  it('rejects promise if changing name of with invalid name', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    const invalid_names = [
      '', // blank
      null, // null
      ' ', // whitespace
      '\n',
      '\t',
      '\r',
    ];
    for (const name of invalid_names) {
      try {
        await db.setRemixName(id0, name);
        assert.fail('Invalid remix name did not cause error');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Invalid Remix Name');
      }
    }

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(
      (await db.getRemixName(id0)) === 'test_remix0',
      'Does not update remix name with new name'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not update other remixes'
    );
    await db.close();
  });

  it('rejects promise if changing name of invalid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

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
        await db.setRemixName(invalid, 'new_name');
        assert.fail('Invalid remix id did not cause error');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Invalid Remix Id');
      }
    }

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(
      (await db.getRemixName(id0)) === 'test_remix0',
      'Does not update remix name with new name'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not update other remixes'
    );
    await db.close();
  });
});

describe('Deleting Remixes', () => {
  it('deletes a valid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    await db.deleteRemix(id0);

    assert((await db.remixCount()) === 1, 'Exactly 1 remix remains');
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not delete other remixes'
    );
    await db.close();
  });

  it('rejects promise if deleting invalid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

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
        await db.deleteRemix(invalid);
        assert.fail('Invalid remix id did not cause error');
      } catch (error) {
        assert.throws(() => {
          throw error;
        }, 'Invalid Remix Id');
      }
    }

    assert((await db.remixCount()) === 2, 'Exactly 2 remixes remains');
    assert(
      (await db.getRemixName(id0)) === 'test_remix0',
      'Does not delete other remixes'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not delete other remixes'
    );
    await db.close();
  });
});

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

describe('Existing Database Initialization', () => {
  it('opens an existing database and finds existing tracks and remixes', async () => {
    const db_location = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'database_interface',
      'database_interface.test.db'
    );
    const db = new DatabaseInterface(db_location);

    const id0 = 'WeWkXbxl7OQXyqAImuOdHBnI+lgKbvr+jI1t0JJ5xTo=';
    const name0 = 'remix_0';
    const remix0_tracks = [
      'spotify_track_0',
      'spotify_track_1',
      'spotify_track_2',
      'spotify_track_3',
    ];
    const id1 = 'EeaNp8zxcWNhIUSWB11RgmTVFTWKzQWhWbifslF/JCY=';
    const name1 = 'remix_1';
    const remix1_tracks = [
      'spotify_track_0',
      'spotify_track_2',
      'spotify_track_4',
      'spotify_track_6',
    ];
    const id2 = 'ZDcGdnwaORyeNmrFLeJvhc78pIHNCLSMJOZ5vaBQBjE=';
    const name2 = 'remix_2';
    const remix2_tracks = [
      'spotify_track_0',
      'spotify_track_3',
      'spotify_track_6',
      'spotify_track_9',
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
