import { kdTree } from 'kd-tree-javascript';

import { TrackInfo } from '../database_interface/track_db_interface';
import { SectionProps } from './get_track_sections';

type TreePoint = {
  track_index: number;
  section_index: number;
  loudness: number;
  tempo: number;
  key: number;
  mode: number;
  time_signature: number;
};

const WEIGHTS = Object.freeze({
  loudness: 0.3,
  tempo: 0.3,
  key: 0.3,
  mode: 0.05,
  time_signature: 0.05,
});

/**
 * distance() - Calculates the distance between two tree points representing a track section
 * @param a - A tree point
 * @param b - Another tree point
 * @returns distance between 2 points (float between 0-1). Guaranteed to be 0 for the same point
 */
function distance(a: TreePoint, b: TreePoint): number {
  let loudness_diff = Math.abs((a.loudness - b.loudness) / a.loudness);
  loudness_diff *= WEIGHTS.loudness;

  let tempo_diff = Math.abs((a.tempo - b.tempo) / a.tempo);
  tempo_diff *= WEIGHTS.tempo;

  let key_diff = Math.abs(a.key - b.key);
  key_diff = (key_diff < 6 ? key_diff : 12 - key_diff) / 12.0;
  key_diff = a.key === -1 || b.key === -1 ? 1.0 : key_diff; // default to max distance if either track does not have a detected key
  key_diff *= WEIGHTS.key;

  let mode_diff = a.mode === b.mode && a.mode !== -1 ? 0.0 : 1.0; // 0 distance if modes match and are detected
  mode_diff *= WEIGHTS.mode;

  let time_signature_diff = 1.0;
  time_signature_diff = a.time_signature % 2 === 0 && b.time_signature % 2 === 0 ? 0.2 : time_signature_diff;
  time_signature_diff = a.time_signature % 3 === 0 && b.time_signature % 3 === 0 ? 0.2 : time_signature_diff; // partial distance if time_signatures share common divisor
  time_signature_diff = a.time_signature === b.time_signature ? 0.0 : time_signature_diff; // default to 0 distance if time signatures match
  time_signature_diff *= WEIGHTS.time_signature;

  return loudness_diff + tempo_diff + key_diff + mode_diff + time_signature_diff;
}

/**
 * findOptimalMashup() - Finds the optimal mashup order
 * @param start_track_id - track_id of track to start with
 * @param track_ids - array of track ids in source
 * @param track_sections - array of arrays of sections of corresponding track (i.e. track_sections[0] is the list of sections for track_ids[0])
 * @returns - Array of TrackInfo of the optimal mashup
 */
export default async function findOptimalMashup(
  start_track_id: string,
  track_ids: Array<string>,
  track_sections: Array<Array<SectionProps>>
): Promise<Array<TrackInfo>> {
  const tree = new kdTree<TreePoint>([], distance, ['loudness', 'tempo', 'key', 'mode', 'time_signature']);

  const points: Array<Array<TreePoint>> = [];
  const optimal: Array<TrackInfo> = [];

  let current_section_props: TreePoint;

  for (let i = 0; i < track_sections.length; i++) {
    points.push([]);

    // skip track if it is the starting track, instead save it to optimal mashup and set current_section_props
    if (track_ids[i] === start_track_id) {
      const { loudness, tempo, key, mode, time_signature } = track_sections[i][0];
      current_section_props = { track_index: i, section_index: 0, loudness, tempo, key, mode, time_signature };

      const { start_ms, end_ms } = track_sections[i][0];
      const track_id = track_ids[i];
      const track_info = { track_id, start_ms, end_ms };
      optimal.push(track_info);
      continue;
    }

    // insert all track sections into tree
    for (let j = 0; j < track_sections[i].length; j++) {
      const { loudness, tempo, key, mode, time_signature } = track_sections[i][j];
      points[i].push({ track_index: i, section_index: j, loudness, tempo, key, mode, time_signature }); // save reference to point for use later
      tree.insert(points[i][j]);
    }

    await new Promise((resolve) => setImmediate(resolve)); // don't block thread
  }

  // need to generate same number of tracks as were given
  for (let i = 1; i < track_sections.length; i++) {
    const [nearest] = tree.nearest(current_section_props, 1)[0];

    // remove sections in same track
    for (let j = 0; j < track_sections[nearest.track_index].length; j++) {
      tree.remove(points[nearest.track_index][j]);
    }

    const { start_ms, end_ms } = track_sections[nearest.track_index][nearest.section_index];
    const track_id = track_ids[nearest.track_index];
    const track_info = { track_id, start_ms, end_ms };
    optimal.push(track_info);
    current_section_props = nearest;

    await new Promise((resolve) => setImmediate(resolve)); // don't block thread
  }

  return optimal;
}
