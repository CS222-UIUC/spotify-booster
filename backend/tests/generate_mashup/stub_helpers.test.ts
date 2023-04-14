import sinon from 'sinon';

import * as getSourceTracks from '../../src/generate_mashup/get_source_tracks';
import * as getTrackSections from '../../src/generate_mashup/get_track_sections';
import * as findOptimalMashup from '../../src/generate_mashup/find_optimal_mashup';
import * as saveToDb from '../../src/generate_mashup/save_to_db';
import { TrackInfo } from '../../src/database_interface/track_db_interface';

const source_tracks = ['track_id0', 'track_id1', 'track_id2'];
const optimal_mashup: Array<TrackInfo> = [
  { track_id: 'track_id1', start_ms: 0, end_ms: 32.321 },
  { track_id: 'track_id0', start_ms: 0, end_ms: 12.123 },
  { track_id: 'track_id2', start_ms: 0, end_ms: 23.231 },
];
const track0_sections = [
  {
    start_ms: 0,
    end_ms: 12.123,
    loudness: -1.23,
    tempo: 123,
    key: 0,
    mode: 0,
    time_signature: 3,
  },
];
const track1_sections = [
  {
    start_ms: 0,
    end_ms: 32.321,
    loudness: -3.21,
    tempo: 321,
    key: 1,
    mode: -1,
    time_signature: 4,
  },
];
const track2_sections = [
  {
    start_ms: 0,
    end_ms: 23.231,
    loudness: -2.31,
    tempo: 231,
    key: 11,
    mode: 0,
    time_signature: 7,
  },
];
export { source_tracks, optimal_mashup, track0_sections, track1_sections, track2_sections };

let throw_error = {
  getSourceTracks: false,
  getTrackSections: false,
  findOptimalMashup: false,
  saveToDb: false,
};
// Select Function to Throw Error
export function throwError(te: {
  getSourceTracks: boolean;
  getTrackSections: boolean;
  findOptimalMashup: boolean;
  saveToDb: boolean;
}) {
  throw_error = Object.assign(throw_error, te);
}

/**
 * stubHelpers() - Stubs the helper functions with spied functions that return dummy data or throw error when throwError is set
 * @returns - spies for each stubbed helper function
 */
export function stubHelpers() {
  const getSourceTracksSpy = sinon.spy(() => {
    if (throw_error.getSourceTracks) return Promise.reject(new Error('Get Source Tracks Error'));
    return Promise.resolve(source_tracks);
  });
  sinon.stub(getSourceTracks, 'default').callsFake(getSourceTracksSpy);

  const getTracksSectionsSpy = sinon.spy((track_id: string) => {
    if (throw_error.getTrackSections) return Promise.reject(new Error('Get Track Sections Error'));

    if (track_id === 'track_id0') return Promise.resolve(track0_sections);
    if (track_id === 'track_id1') return Promise.resolve(track1_sections);
    if (track_id === 'track_id2') return Promise.resolve(track2_sections);
    return Promise.resolve([]);
  });
  sinon.stub(getTrackSections, 'default').callsFake(getTracksSectionsSpy);

  const findOptimalMashupSpy = sinon.spy(() => {
    if (throw_error.findOptimalMashup) return Promise.reject(new Error('Find Optimal Mashup Error'));

    return Promise.resolve(optimal_mashup);
  });
  sinon.stub(findOptimalMashup, 'default').callsFake(findOptimalMashupSpy);

  const saveToDbSpy = sinon.spy(() => {
    if (throw_error.saveToDb) return Promise.reject(new Error('Save To DB Error'));

    return Promise.resolve();
  });
  sinon.stub(saveToDb, 'default').callsFake(saveToDbSpy);

  return {
    getSourceTracksSpy,
    getTracksSectionsSpy,
    findOptimalMashupSpy,
    saveToDbSpy,
  };
}
