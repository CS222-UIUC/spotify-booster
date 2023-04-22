import { SpotifyAPI } from '../spotify_authentication/spotify_api_import';
import { awaitAllPromises } from '../utils';

import { SourceType } from './generate_mashup';
import { spotify_api_config } from '../config/config';

/**
 * getAlbumTracks() - Gets the track_ids of an album
 * @param album_id - spotify album id to fetch tracks of
 * @param access_token - spotify api access token
 * @returns Promise resolving to array of strings represeting spotify track_ids
 */
async function getAlbumTracks(album_id: string, access_token: string): Promise<Array<string>> {
  const spotify_api = new SpotifyAPI({
    clientId: spotify_api_config.client_id,
    clientSecret: spotify_api_config.client_secret,
    redirectUri: spotify_api_config.redirect_url,
  });
  spotify_api.setAccessToken(access_token);

  const album_info = await spotify_api.getAlbum(album_id);

  const fetch_track_info = [];
  // tracks split into chunks of 50 for albums, need to fetch them all
  for (let i = 0; i < album_info.body.total_tracks; i += 50) {
    fetch_track_info.push(
      spotify_api.getAlbumTracks(album_id, {
        limit: 50,
        offset: i,
      })
    );
  }

  const track_info_responses = await awaitAllPromises(fetch_track_info);

  // pull out just track id
  const tracks = [];
  for (const track_info_res of track_info_responses) {
    for (const track of track_info_res.body.items) {
      tracks.push(track.id);
    }
  }

  return tracks;
}

/**
 * getPlaylistTracks() - Gets the track_ids of an playlist
 * @param playlist_id - spotify playlist id to fetch tracks of
 * @param access_token - spotify api access token
 * @returns Promise resolving to array of strings represeting spotify track_ids
 */
async function getPlaylistTracks(playlist_id: string, access_token: string): Promise<Array<string>> {
  const spotify_api = new SpotifyAPI({
    clientId: spotify_api_config.client_id,
    clientSecret: spotify_api_config.client_secret,
    redirectUri: spotify_api_config.redirect_url,
  });
  spotify_api.setAccessToken(access_token);

  const playlist_info = await spotify_api.getPlaylist(playlist_id);

  const fetch_track_info = [];
  // tracks split into chunks of 50 for albums, need to fetch them all
  for (let i = 0; i < playlist_info.body.tracks.total; i += 50) {
    fetch_track_info.push(
      spotify_api.getPlaylistTracks(playlist_id, {
        limit: 50,
        offset: i,
      })
    );
  }

  const track_info_responses = await awaitAllPromises(fetch_track_info);

  // pull out just track id
  const tracks = [];
  for (const track_info_res of track_info_responses) {
    for (const { track } of track_info_res.body.items) {
      if (track) tracks.push(track.id);
    }
  }

  return tracks;
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
  switch (source_type) {
    case SourceType.Album: {
      return await getAlbumTracks(source_id, access_token);
    }
    case SourceType.Playlist: {
      return await getPlaylistTracks(source_id, access_token);
    }
    default: {
      throw new Error('Source Type Invalid');
    }
  }
}
