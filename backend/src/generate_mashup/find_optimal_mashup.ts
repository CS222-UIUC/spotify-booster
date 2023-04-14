import { TrackInfo } from '../database_interface/track_db_interface';
import { SectionProps } from './get_track_sections';

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
  return [];
}
