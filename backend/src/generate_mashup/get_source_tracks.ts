import { SourceType } from './generate_mashup';

/**
 * getAlbumTracks() - Gets the track_ids of an album
 * @param album_id - spotify album id to fetch tracks of
 * @param access_token - spotify api access token
 * @returns Promise resolving to array of strings represeting spotify track_ids
 */
async function getAlbumTracks(album_id: string, access_token: string): Promise<Array<string>> {
  return Promise.resolve([]);
}

/**
 * getPlaylistTracks() - Gets the track_ids of an playlist
 * @param playlist_id - spotify playlist id to fetch tracks of
 * @param access_token - spotify api access token
 * @returns Promise resolving to array of strings represeting spotify track_ids
 */
async function getPlaylistTracks(playlist_id: String, access_token: string): Promise<Array<string>> {
  return Promise.resolve([]);
}

/**
 * getSourceTracks() - Gets the tracks of a mashup source
 * @param source_id - spotify id of album or playlist to use as a source
 * @param source_type - type of spotify source
 * @param access_token - spotify api access token
 * @returns Promise resolving to array of strings represeting spotify track_ids
 */
export default async function getSourceTracks(
  source_id: string,
  source_type: SourceType,
  access_token: string
): Promise<Array<string>> {
  return Promise.resolve([]);
}
