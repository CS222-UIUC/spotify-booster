import { assert } from 'chai';

import { optimal_mashup, source_tracks, sections, extra_track_sections, stubHelpers, throwError } from './stub_helpers.test';
import GenerateMashup, { SourceType } from '../../src/generate_mashup/generate_mashup';
import { stubLogger } from '../test_utils/stubs/stub_logger.test';
import DatabaseInterface from '../../src/database_interface/database_interface';
import { arraysMatchOrdered } from '../test_utils/assertions/arrays_match.test';
import { matchTracks } from '../database_interface/database_interface_utils.test';
import { compareAllTrackSections } from './generate_mashup_utils.test';
import stubConfig from '../test_utils/stubs/stub_config.test';

describe('Generate Mashup', () => {
  const mashup_id = 'some_mashup_id';
  const source_id = 'some_source_id';
  const source_type = SourceType.Album;
  const access_token = 'valid_token';
  const db = 'imposter db' as unknown as DatabaseInterface;

  beforeEach(function () {
    stubConfig({ spotify_api_config: { batch_request_amount: 100, batch_request_interval: 0 } });
    const { getSourceTracksSpy, getTracksSectionsSpy, findOptimalMashupSpy, saveToDbSpy } = stubHelpers();

    this.getSourceTracksSpy = getSourceTracksSpy;
    this.getTracksSectionsSpy = getTracksSectionsSpy;
    this.findOptimalMashupSpy = findOptimalMashupSpy;
    this.saveToDbSpy = saveToDbSpy;
  });

  it('calls helper methods correctly', async function () {
    const start_track_id = '200';
    await GenerateMashup(mashup_id, '200', source_id, source_type, access_token, db, stubLogger());

    assert.equal(this.getSourceTracksSpy.callCount, 1, 'getSourceTracks called once');
    const get_source_tracks_args = this.getSourceTracksSpy.getCall(0).args;
    assert.equal(get_source_tracks_args[0], source_id, 'Called getSourceTracks with correct arg 0');
    assert.equal(get_source_tracks_args[1], source_type, 'Called getSourceTracks with correct arg 1');
    assert.equal(get_source_tracks_args[2], access_token, 'Called getSourceTracks with correct arg 2');

    assert.equal(this.getTracksSectionsSpy.callCount, source_tracks.length + 1, 'getTracksSections called for each track');
    for (let i = 0; i < source_tracks.length; i++) {
      const args = this.getTracksSectionsSpy.getCall(i).args;
      assert.equal(args[0], source_tracks[i], `Call ${i} getTracksSections correct arg 0`);
      assert.equal(args[1], access_token, `Call ${i} getTracksSections correct arg 1`);
    }

    assert.equal(this.findOptimalMashupSpy.callCount, 1, 'findOptimalMashup called once');
    const find_opt_args = this.findOptimalMashupSpy.getCall(0).args;
    assert.equal(find_opt_args[0], start_track_id, 'Called findOptimalMashup with correct arg 0');
    arraysMatchOrdered(find_opt_args[1], [...source_tracks, start_track_id], 'Source Tracks');
    arraysMatchOrdered(find_opt_args[2], [...sections, extra_track_sections], 'Track Sections', compareAllTrackSections);

    assert.equal(this.saveToDbSpy.callCount, 1, 'saveToDb called once');
    const save_to_db_args = this.saveToDbSpy.getCall(0).args;
    assert.equal(save_to_db_args[0], db, 'Called saveToDb with correct arg 0');
    assert.equal(save_to_db_args[1], mashup_id, 'Called saveToDb with correct arg 1');
    arraysMatchOrdered(save_to_db_args[2], optimal_mashup, 'Optimal Mashup', matchTracks);
  });

  it('throws friendly errors when helpers fail', async () => {
    const log = stubLogger();

    throwError({ getSourceTracks: true, getTrackSections: false, findOptimalMashup: false, saveToDb: false });
    await assert.isRejected(
      GenerateMashup(mashup_id, source_tracks[0], source_id, source_type, access_token, db, log),
      'Failed To Get Tracks From Source'
    );

    throwError({ getSourceTracks: false, getTrackSections: true, findOptimalMashup: false, saveToDb: false });
    await assert.isRejected(
      GenerateMashup(mashup_id, source_tracks[0], source_id, source_type, access_token, db, log),
      'Failed To Get Track Sections'
    );

    throwError({ getSourceTracks: false, getTrackSections: false, findOptimalMashup: true, saveToDb: false });
    await assert.isRejected(
      GenerateMashup(mashup_id, source_tracks[0], source_id, source_type, access_token, db, log),
      'Failed To Generate Mashup'
    );

    throwError({ getSourceTracks: false, getTrackSections: false, findOptimalMashup: false, saveToDb: true });
    await assert.isRejected(
      GenerateMashup(mashup_id, source_tracks[0], source_id, source_type, access_token, db, log),
      'Failed To Save Mashup'
    );
  });
});
