import { assert } from 'chai';
import path from 'path';
import crypto from 'crypto';

import DatabaseInterface from '../../src/database_interface/database_interface';
import { createDirectory, removeDirectory } from '../test_utils/hooks/create_test_directory.test';
import { stubLogger } from '../test_utils/stubs/stub_logger.test';
import uniqueID from '../test_utils/unique_id.test';
import { checkTrackDB } from './database_interface_utils.test';

const TEST_DB_DIRECTORY = path.join(__dirname, 'test_track_db_interface');

describe('Track DB Interface', () => {
  before(() => {
    createDirectory(TEST_DB_DIRECTORY);
  });

  beforeEach(async function () {
    stubLogger();

    this.db_location = path.join(TEST_DB_DIRECTORY, uniqueID());
    this.db = new DatabaseInterface(this.db_location);

    this.id0 = await this.db.createRemix('test_remix0');
    this.id1 = await this.db.createRemix('test_remix1');

    this.default_remix0 = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 }, // default start_ms and end_ms values
      { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
    ];
    this.default_remix1 = [
      { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id4', start_ms: 0, end_ms: -1 },
      { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
    ];
    for (const track of this.default_remix0) await this.db.addTrack(this.id0, track.track_id);
    for (const track of this.default_remix1) await this.db.addTrack(this.id1, track.track_id);
  });

  afterEach(async function () {
    await this.db.close();
  });

  after(() => {
    removeDirectory(TEST_DB_DIRECTORY);
  });

  describe('Creating Tracks', () => {
    it('creates tracks when given valid remix id', async function () {
      await checkTrackDB(this.db, this.id0, this.id1, this.default_remix0, this.default_remix1, 8);
    });

    it('rejects promise if creating a track with invalid remix id', async function () {
      const invalid_ids = [
        '', // blank
        '\n',
        ' ',
        '%', // invalid base64 characters
        '!',
        '=!',
        'asdf', // too short
        this.id0 + 'a', // similar to existing id
        'a' + this.id0,
        this.id0 + this.id1,
        crypto.createHash('sha256').update((100).toString()).digest('base64'), // correct format but non existing id
      ];
      for (const invalid of invalid_ids) {
        await assert.isRejected(this.db.addTrack(invalid, 'some_spotify_id10'), 'Invalid Remix Id');
      }

      await checkTrackDB(this.db, this.id0, this.id1, this.default_remix0, this.default_remix1, 8);
    });

    it('rejects promise if creating a track with blank track id', async function () {
      await assert.isRejected(this.db.addTrack(this.id0, ''), 'Invalid Track Id');

      await checkTrackDB(this.db, this.id0, this.id1, this.default_remix0, this.default_remix1, 8);
    });

    it('rejects promise if creating a track that that is already in the remix', async function () {
      await assert.isRejected(this.db.addTrack(this.id0, 'some_spotify_id0'), 'Track Id Exists In Remix');

      await checkTrackDB(this.db, this.id0, this.id1, this.default_remix0, this.default_remix1, 8);
    });
  });

  describe('Removing Tracks', () => {
    it('removes a track with valid ids', async function () {
      const updated_remix0 = [
        { track_id: 'some_spotify_id1', start_ms: 0, end_ms: -1 },
        { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
        { track_id: 'some_spotify_id3', start_ms: 0, end_ms: -1 },
      ];
      const updated_remix1 = [
        { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
        { track_id: 'some_spotify_id2', start_ms: 0, end_ms: -1 },
        { track_id: 'some_spotify_id6', start_ms: 0, end_ms: -1 },
      ];

      await this.db.removeTrack(this.id0, 'some_spotify_id0');
      await this.db.removeTrack(this.id1, 'some_spotify_id4');

      await checkTrackDB(this.db, this.id0, this.id1, updated_remix0, updated_remix1, 6);
    });

    it('rejects promise if removing track with invalid track id', async function () {
      const invalid_ids = [
        '', // blank
        '\n',
        ' ',
        's0me_spotify_id0', // similar
      ];
      for (const id of invalid_ids) {
        await assert.isRejected(this.db.removeTrack(this.id0, id), 'Invalid Track Id');
      }

      await checkTrackDB(this.db, this.id0, this.id1, this.default_remix0, this.default_remix1, 8);
    });

    it('rejects promise if removing track with invalid remix id', async function () {
      const invalid_ids = [
        '', // blank
        '\n',
        ' ',
        '%', // invalid base64 characters
        '!',
        '=!',
        'asdf', // too short
        this.id0 + 'a', // similar to existing id
        'a' + this.id0,
        this.id0 + this.id1,
        crypto.createHash('sha256').update((100).toString()).digest('base64'), // correct format but non existing id
      ];
      for (const id of invalid_ids) {
        await assert.isRejected(this.db.removeTrack(id, 'some_spotify_id0'), 'Invalid Remix Id');
      }

      await checkTrackDB(this.db, this.id0, this.id1, this.default_remix0, this.default_remix1, 8);
    });
  });

  describe('Track start/stop Data', () => {
    it('Updates start and end data', async function () {
      const updated_remix0 = [
        { track_id: 'some_spotify_id0', start_ms: 0, end_ms: -1 },
        { track_id: 'some_spotify_id1', start_ms: 10, end_ms: 0 },
        { track_id: 'some_spotify_id2', start_ms: 20, end_ms: 19 },
        { track_id: 'some_spotify_id3', start_ms: 100, end_ms: 100 },
      ];
      for (const track of updated_remix0) {
        await this.db.setStartMS(this.id0, track.track_id, track.start_ms);
        await this.db.setEndMS(this.id0, track.track_id, track.end_ms);
      }

      await checkTrackDB(this.db, this.id0, this.id1, updated_remix0, this.default_remix1, 8);
    });

    it('rejects invalid start and end data', async function () {
      await assert.isRejected(this.db.setStartMS(this.id0, this.default_remix0[0].track_id, -1), 'start_ms cannot be negative');
      await assert.isRejected(this.db.setEndMS(this.id0, this.default_remix0[0].track_id, -2), 'end_ms cannot be less than -1');

      await checkTrackDB(this.db, this.id0, this.id1, this.default_remix0, this.default_remix1, 8);
    });

    it('rejects invalid track or remix id when setting start of stop data', async function () {
      const unknown_remix = 'some_remix';
      await assert.isRejected(this.db.setStartMS(unknown_remix, this.default_remix0[0].track_id, 0), 'Invalid Remix Id');
      await assert.isRejected(this.db.setEndMS(unknown_remix, this.default_remix0[0].track_id, 0), 'Invalid Remix Id');

      await assert.isRejected(this.db.setStartMS(this.id0, this.default_remix1[3].track_id, 0), 'Invalid Track Id');
      await assert.isRejected(this.db.setEndMS(this.id0, this.default_remix1[3].track_id, 0), 'Invalid Track Id');

      await checkTrackDB(this.db, this.id0, this.id1, this.default_remix0, this.default_remix1, 8);
    });
  });
});
