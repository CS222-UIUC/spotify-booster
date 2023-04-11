import DatabaseInterface from '../database_interface/database_interface';
import Logger from '../logger/logger';

export enum SourceType {
  Album = 0,
  Playlist = 1,
}

/**
 * GenerateMashup() - Generates a mashup and saves it to the database at given mashup_id
 * @param mashup_id - mashup_id of mashup to save to
 * @param start_track_id - spotify track_id of track to start with
 * @param source_id - spotify id of album or playlist to use as a source
 * @param source_type - type of spotify source
 * @param access_token - spotify api access token
 * @returns Promise that resolves once mashup has been created successsfully
 */
export default async function GenerateMashup(
  mashup_id: string,
  start_track_id: string,
  source_id: string,
  source_type: SourceType,
  access_token: string,
  db: DatabaseInterface,
  log: Logger
): Promise<void> {
  return Promise.resolve();
}
