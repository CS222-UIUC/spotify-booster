import { TrackInfo } from '../../src/database_interface/track_db_interface';

/**
 * matchTracks() - Compares two tracks and returns true if they match
 * @param a - A TrackInfo object
 * @param b - Another TrackInfo object
 * @returns - if tracks match or not
 */
export function matchTracks(a: TrackInfo, b: TrackInfo): boolean {
  return a.track_id === b.track_id && a.start_ms === b.start_ms && a.end_ms === b.end_ms;
}
