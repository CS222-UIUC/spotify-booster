import { awaitAllPromises } from '../utils';
import DatabaseInterface from '../database_interface/database_interface';
import { TrackInfo } from '../database_interface/track_db_interface';

/**
 * saveToDb() - saves tracks to database
 * @param db - database to save to
 * @param mashup_id - mashup_id of mashup to save to
 * @param tracks - array of TrackInfo of tracks to insert to mashup
 */
export default async function saveToDb(db: DatabaseInterface, mashup_id: string, tracks: Array<TrackInfo>): Promise<void> {
  const await_create_tracks = [];
  for (const { track_id } of tracks) {
    await_create_tracks.push(db.addTrack(mashup_id, track_id));
  }

  await awaitAllPromises(await_create_tracks);

  const await_set_sections = [];
  for (const track of tracks) {
    await_set_sections.push(db.setStartMS(mashup_id, track.track_id, track.start_ms));
    await_set_sections.push(db.setEndMS(mashup_id, track.track_id, track.end_ms));
  }

  await awaitAllPromises(await_set_sections);
}
