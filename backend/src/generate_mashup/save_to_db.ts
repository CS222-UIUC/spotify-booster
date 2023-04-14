import DatabaseInterface from '../database_interface/database_interface';
import { TrackInfo } from '../database_interface/track_db_interface';

/**
 * saveToDb() - saves tracks to database
 * @param db - database to save to
 * @param mashup_id - mashup_id of mashup to save to
 * @param tracks - array of TrackInfo of tracks to insert to mashup
 */
export default async function saveToDb(db: DatabaseInterface, mashup_id: string, tracks: Array<TrackInfo>): Promise<void> {
  //
}
