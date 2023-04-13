import sinon from 'sinon';

import * as SpotifyAPI from '../../src/spotify_authentication/spotify_api_import';

const long_album_tracks: Array<string> = [];
for (let i = 0; i < 51; i++) long_album_tracks.push(`long_album_track${i}`);

const short_album_tracks: Array<string> = [];
for (let i = 0; i < 50; i++) short_album_tracks.push(`short_album_track${i}`);

const playlist_tracks: Array<string> = [];
for (let i = 0; i < 100; i++) long_album_tracks.push(`playlist_track${i}`);

export { long_album_tracks, short_album_tracks, playlist_tracks };

let throw_error = {
  getAlbum: false,
  getAlbumTracks: false,
  getPlaylist: false,
};
export function throwError(te: { getAlbum?: boolean; getAlbumTracks?: boolean; getPlaylist?: boolean }) {
  throw_error = Object.assign(throw_error, te);
}

/**
 * getAlbum() - Stub of getAlbum method of spotify_api
 * if album_id = 'long_album_id'
 *    returns mock api response of a long album (>50 tracks)
 * if album_id = 'short_album_id'
 *    returns mock api response of a short album (<=50 tracks)
 * otherwise
 *    return mock api response of an empty album
 *
 * Throws an error if throw_error.getAlbum is true
 *
 * @param album_id - album_id of album to get
 * @returns - promise resolving to object similar to spotify_api response
 */
const getAlbum = (album_id: string) => {
  if (throw_error.getAlbum) return Promise.reject(new Error('Get Album Failed'));
  if (album_id === 'long_album_id')
    return Promise.resolve({
      body: {
        total_tracks: long_album_tracks.length,
      },
    });

  if (album_id === 'short_album_id')
    return Promise.resolve({
      body: {
        total_tracks: short_album_tracks.length,
      },
    });

  return Promise.resolve({
    body: {
      total_tracks: 0,
    },
  });
};

/**
 * getAlbumTracks() - Stub of getAlbumTracks method of spotify_api
 * if album_id = 'long_album_id'
 *    returns mock api response of a long album (>50 tracks)
 * if album_id = 'short_album_id'
 *    returns mock api response of a short album (<=50 tracks)
 * otherwise
 *    return mock api response of an empty album
 *
 * Throws an error if throw_error.getAlbumTracks is true
 *
 * @param album_id - album_id of album to get
 * @returns - promise resolving to object similar to spotify_api response
 */
const getAlbumTracks = (album_id: string, options: { limit: number; offset: number }) => {
  if (throw_error.getAlbumTracks) return Promise.reject(new Error('Get Album Tracks Failed'));
  if (album_id === 'long_album_id')
    return Promise.resolve({
      body: {
        items: long_album_tracks.slice(options.offset, options.offset + options.limit).map((id) => {
          return { id };
        }),
      },
    });

  if (album_id === 'short_album_id')
    return Promise.resolve({
      body: {
        items: short_album_tracks.slice(options.offset * 50, options.offset * 50 + options.limit).map((id) => {
          return { id };
        }),
      },
    });

  return Promise.resolve({
    body: {
      items: [] as Array<{ track_id: string }>,
    },
  });
};

/**
 * getPlaylist() - Stub of getPlaylist method of spotify_api
 * if playlist_id = 'some_playlist_id'
 *    returns mock api response of a filled playlist
 * otherwise
 *    return mock api response of an empty playlist
 *
 * Throws an error if throw_error.getPlaylist is true
 *
 * @param album_id - album_id of album to get
 * @returns - promise resolving to object similar to spotify_api response
 */
const getPlaylist = (playlist_id: string) => {
  if (throw_error.getPlaylist) return Promise.reject(new Error('Get Playlist Failed'));
  if (playlist_id === 'some_playlist_id')
    return {
      body: {
        tracks: {
          items: playlist_tracks.map((id) => {
            return { id };
          }),
        },
      },
    };

  return {
    body: {
      tracks: {
        items: [] as Array<{ id: string }>,
      },
    },
  };
};

/**
 * stubSpotifyAPI() - Stubs constructor for spotify_api to return stubbed spotify_api object
 * Throws an error if the provided access token does not the expected one
 * @param expected_access_token - the expected access_token to be passed to spotify_api
 */
export function stubSpotifyAPI(expected_access_token: string) {
  sinon.stub(SpotifyAPI, 'SpotifyAPI').callsFake(() => {
    return {
      setAccessToken: (access_token: string) => {
        // actual method does not throw an error, but throw an error here so we can be sure we passed the correct token to spotify api module
        if (access_token !== expected_access_token) throw new Error('Incorrect Access Token Provided');
      },
      getAlbum,
      getAlbumTracks,
      getPlaylist,
    };
  });
}
