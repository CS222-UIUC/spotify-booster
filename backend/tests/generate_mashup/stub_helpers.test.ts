import sinon from 'sinon';

import * as getSourceTracks from '../../src/generate_mashup/get_source_tracks';
import * as getTrackSections from '../../src/generate_mashup/get_track_sections';
import * as findOptimalMashup from '../../src/generate_mashup/find_optimal_mashup';
import * as saveToDb from '../../src/generate_mashup/save_to_db';
import { TrackInfo } from '../../src/database_interface/track_db_interface';

const num_tracks = 200;

const source_tracks: Array<string> = [];
const sections: Array<Array<getTrackSections.SectionProps>> = [];
for (let i = 0; i < num_tracks; i++) {
  source_tracks.push(`${i}`);
  sections.push([]);

  for (let j = 0; j < Math.floor(i / 10) + 1; j++) {
    sections[i].push({
      start_ms: j * 10.5 * 1000, // some float >=0
      end_ms: (j + 1) * 10.5 * 1000,
      loudness: -1 * (j + 1), // some float <0
      tempo: (j + 1) * 10.5, // some float >0
      key: j, // integers 0-11 (inclusive)
      mode: -1 + (j % 3), // possible values are -1, 0, 1
      time_signature: 3 + (j % 5), // possible values are 3, 4, 5, 6, 7
    });
  }
}

const optimal_mashup: Array<TrackInfo> = [];
for (let i = num_tracks - 1; i >= 0; i--) {
  optimal_mashup.push({
    track_id: source_tracks[i],
    start_ms: sections[i][0].start_ms,
    end_ms: sections[i][0].end_ms,
  });
}

export { source_tracks, optimal_mashup, sections };

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

    return Promise.resolve(sections[parseInt(track_id)]);
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
