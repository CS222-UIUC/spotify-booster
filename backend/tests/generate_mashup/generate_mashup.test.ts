import { assert } from 'chai';

import {
  optimal_mashup,
  source_tracks,
  stubHelpers,
  throwError,
  track0_sections,
  track1_sections,
  track2_sections,
} from './stub_helpers.test';
import GenerateMashup, { SourceType } from '../../src/generate_mashup/generate_mashup';
import { stubLogger } from '../test_utils/stubs/stub_logger.test';
import DatabaseInterface from '../../src/database_interface/database_interface';
import { arraysMatchOrdered } from '../test_utils/assertions/arrays_match.test';
import { matchTracks } from '../database_interface/database_interface_utils.test';
import { compareAllTrackSections } from './generate_mashup_utils.test';

describe('Generate Mashup', () => {
  const mashup_id = 'some_mashup_id';
  const start_track_id = source_tracks[1];
  const source_id = 'some_source_id';
  const source_type = SourceType.Album;
  const access_token = 'valid_token';
  const db = 'imposter db' as unknown as DatabaseInterface;

  beforeEach(function () {
    const { getSourceTracksSpy, getTracksSectionsSpy, findOptimalMashupSpy, saveToDbSpy } = stubHelpers();

    this.getSourceTracksSpy = getSourceTracksSpy;
    this.getTracksSectionsSpy = getTracksSectionsSpy;
    this.findOptimalMashupSpy = findOptimalMashupSpy;
    this.saveToDbSpy = saveToDbSpy;
  });

  it('calls helper methods correctly', async function () {
    await GenerateMashup(mashup_id, start_track_id, source_id, source_type, access_token, db, stubLogger());

    assert.equal(this.getSourceTracksSpy.callCount, 1, 'getSourceTracks called once');
    assert.equal(this.getSourceTracksSpy.getCall(0).args[0], source_id, 'Called getSourceTracks with correct arg 0');
    assert.equal(this.getSourceTracksSpy.getCall(0).args[1], source_type, 'Called getSourceTracks with correct arg 1');
    assert.equal(this.getSourceTracksSpy.getCall(0).args[2], access_token, 'Called getSourceTracks with correct arg 2');

    assert.equal(this.getTracksSectionsSpy.callCount, 3, 'getTracksSections called 3 times');
    assert.equal(this.getTracksSectionsSpy.getCall(0).args[0], source_tracks[0], 'Call 0 getTracksSections correct arg 0');
    assert.equal(this.getTracksSectionsSpy.getCall(0).args[1], access_token, 'Call 0 getTracksSections correct arg 1');
    assert.equal(this.getTracksSectionsSpy.getCall(1).args[0], source_tracks[1], 'Call 1 getTracksSections correct arg 0');
    assert.equal(this.getTracksSectionsSpy.getCall(1).args[1], access_token, 'Call 1 getTracksSections correct arg 1');
    assert.equal(this.getTracksSectionsSpy.getCall(2).args[0], source_tracks[2], 'Call 2 getTracksSections correct arg 0');
    assert.equal(this.getTracksSectionsSpy.getCall(2).args[1], access_token, 'Call 2 getTracksSections correct arg 1');

    assert.equal(this.findOptimalMashupSpy.callCount, 1, 'findOptimalMashup called once');
    assert.equal(
      this.findOptimalMashupSpy.getCall(0).args[0],
      start_track_id,
      'Called findOptimalMashup with correct arg 0'
    );
    arraysMatchOrdered(this.findOptimalMashupSpy.getCall(0).args[1], source_tracks, 'Source Tracks');
    arraysMatchOrdered(
      this.findOptimalMashupSpy.getCall(0).args[2],
      [track0_sections, track1_sections, track2_sections],
      'Track Sections',
      compareAllTrackSections
    );

    assert.equal(this.saveToDbSpy.callCount, 1, 'saveToDb called once');
    assert.equal(this.saveToDbSpy.getCall(0).args[0], db, 'Called saveToDb with correct arg 0');
    assert.equal(this.saveToDbSpy.getCall(0).args[1], mashup_id, 'Called saveToDb with correct arg 1');
    arraysMatchOrdered(this.saveToDbSpy.getCall(0).args[2], optimal_mashup, 'Optimal Mashup', matchTracks);
  });

  it('throws friendly errors when helpers fail', async () => {
    const log = stubLogger();
    await assert.isRejected(
      GenerateMashup(mashup_id, 'some_track_id', source_id, source_type, access_token, db, log),
      'Start Track Not In Source'
    );

    throwError({ getSourceTracks: true, getTrackSections: false, findOptimalMashup: false, saveToDb: false });
    await assert.isRejected(
      GenerateMashup(mashup_id, start_track_id, source_id, source_type, access_token, db, log),
      'Failed To Get Tracks From Source'
    );

    throwError({ getSourceTracks: false, getTrackSections: true, findOptimalMashup: false, saveToDb: false });
    await assert.isRejected(
      GenerateMashup(mashup_id, start_track_id, source_id, source_type, access_token, db, log),
      'Failed To Get Track Sections'
    );

    throwError({ getSourceTracks: false, getTrackSections: false, findOptimalMashup: true, saveToDb: false });
    await assert.isRejected(
      GenerateMashup(mashup_id, start_track_id, source_id, source_type, access_token, db, log),
      'Failed To Generate Mashup'
    );

    throwError({ getSourceTracks: false, getTrackSections: false, findOptimalMashup: false, saveToDb: true });
    await assert.isRejected(
      GenerateMashup(mashup_id, start_track_id, source_id, source_type, access_token, db, log),
      'Failed To Save Mashup'
    );
  });
});
