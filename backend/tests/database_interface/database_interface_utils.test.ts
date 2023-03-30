import { assert } from 'chai';
import DatabaseInterface from '../../src/database_interface/database_interface';
import { TrackInfo } from '../../src/database_interface/track_db_interface';
import arraysMatchUnordered from '../test_utils/assertions/arrays_match_unordered.test';

/**
 * matchTracks() - Compares two tracks and returns true if they match
 * @param a - A TrackInfo object
 * @param b - Another TrackInfo object
 * @returns - if tracks match or not
 */
export function matchTracks(a: TrackInfo, b: TrackInfo): boolean {
  return a.track_id === b.track_id && a.start_ms === b.start_ms && a.end_ms === b.end_ms;
}

/**
 * checkTrackDB() - Checks that track database contains the expected data
 * @param db - database to check
 * @param id0 - remix id of remix0
 * @param id1 - remix id of remix1
 * @param expected0 - expected tracks in remix0
 * @param expected1 - rexpected tracks in remix1
 * @param total_tracks - total tracks expected in database
 */
export async function checkTrackDB(
  db: DatabaseInterface,
  id0: string,
  id1: string,
  expected0: TrackInfo[],
  expected1: TrackInfo[],
  total_tracks: number
) {
  assert.equal(await db.totalTrackCount(), total_tracks, `Database contains ${total_tracks} tracks`);
  arraysMatchUnordered(await db.getRemixTracks(id0), expected0, matchTracks, 'Remix 0 Tracks');
  arraysMatchUnordered(await db.getRemixTracks(id1), expected1, matchTracks, 'Remix 1 Tracks');
}
