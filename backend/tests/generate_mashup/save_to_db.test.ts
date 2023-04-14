import { assert } from 'chai';
import path from 'path';

import DatabaseInterface from '../../src/database_interface/database_interface';
import { stubLogger } from '../test_utils/stubs/stub_logger.test';
import { createDirectory } from '../test_utils/hooks/create_test_directory.test';
import saveToDb from '../../src/generate_mashup/save_to_db';
import { arraysMatchOrdered } from '../test_utils/assertions/arrays_match.test';
import { matchTracks } from '../database_interface/database_interface_utils.test';
import uniqueID from '../test_utils/unique_id.test';

const TEST_DB_DIRECTORY = path.join(__dirname, 'test_save_to_db');

describe('Save To Database', () => {
  before(() => {
    createDirectory(TEST_DB_DIRECTORY);
  });

  beforeEach(async function () {
    stubLogger();
    this.db = new DatabaseInterface(path.join(TEST_DB_DIRECTORY, uniqueID()));

    this.mashup_id = await this.db.createMashup('test_mashup', 'user_id');
  });

  it('saves tracks correctly to database', async function () {
    const tracks = [
      { track_id: 'some_track_id0', start_ms: 0, end_ms: 1000 },
      { track_id: 'some_track_id1', start_ms: 1000, end_ms: 2000 },
      { track_id: 'some_track_id2', start_ms: 2000, end_ms: 4000 },
      { track_id: 'some_track_id3', start_ms: 3000, end_ms: 8000 },
    ];

    await saveToDb(this.db, this.mashup_id, tracks);

    arraysMatchOrdered(await this.db.getMashupTracks(this.mashup_id), tracks, 'Mashup Tracks', matchTracks);
  });

  it('rejects promise if database errors', async function () {
    const tracks = [
      { track_id: 'some_track_id0', start_ms: 0, end_ms: 1000 },
      { track_id: 'some_track_id1', start_ms: 1000, end_ms: 2000 },
      { track_id: 'some_track_id2', start_ms: 2000, end_ms: 4000 },
      { track_id: 'some_track_id3', start_ms: 3000, end_ms: 8000 },
    ];

    await assert.isRejected(saveToDb(this.db, 'invalid', tracks));
  });
});
