import sinon from 'sinon';

import * as SpotifyAPI from '../../src/spotify_authentication/spotify_api_import';
import { SectionProps } from '../../src/generate_mashup/get_track_sections';

const long_album_tracks: Array<string> = [];
for (let i = 0; i < 51; i++) long_album_tracks.push(`long_album_track${i}`);

const short_album_tracks: Array<string> = [];
for (let i = 0; i < 50; i++) short_album_tracks.push(`short_album_track${i}`);

const playlist_tracks: Array<string> = [];
for (let i = 0; i < 100; i++) playlist_tracks.push(`playlist_track${i}`);

const section_props: Array<SectionProps> = [];
for (let i = 0; i < 1; i++) {
  section_props.push({
    start_ms: i * 10.5 * 1000, // some float >=0
    end_ms: (i + 1) * 10.5 * 1000,
    loudness: -1 * (i + 1), // some float <0
    tempo: (i + 1) * 10.5, // some float >0
    key: i, // integers 0-11 (inclusive)
    mode: -1 + (i % 3), // possible values are -1, 0, 1
    time_signature: 3 + (i % 5), // possible values are 3, 4, 5, 6, 7
  });
}

export { long_album_tracks, short_album_tracks, playlist_tracks, section_props };

let throw_error = {
  getAlbum: false,
  getAlbumTracks: false,
  getPlaylist: false,
  getAudioAnalysisForTrack: false,
};
// Select Function to Throw Error
export function throwError(te: {
  getAlbum: boolean;
  getAlbumTracks: boolean;
  getPlaylist: boolean;
  getAudioAnalysisForTrack: boolean;
}) {
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
        items: [
          ...short_album_tracks.slice(options.offset * 50, options.offset * 50 + options.limit).map((id) => {
            return { id };
          }),
        ],
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
 * @param playlist_id - playlist_id of playlist to get
 * @returns - promise resolving to object similar to spotify_api response
 */
const getPlaylist = (playlist_id: string) => {
  if (throw_error.getPlaylist) return Promise.reject(new Error('Get Playlist Failed'));
  if (playlist_id === 'some_playlist_id')
    return {
      body: {
        tracks: {
          items: [
            ...playlist_tracks.map((id) => {
              return { track: { id } };
            }),
            {}, // add empty item to check null handling
          ],
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
 * getAudioAnalysisForTrack() - Stub of getAudioAnalysisForTrack method of spotify_api
 * Throws an error if throw_error.getAudioAnalysisForTrack is true
 * @returns - promise resolving to object similar to spotify_api response
 */
const getAudioAnalysisForTrack = () => {
  if (throw_error.getAudioAnalysisForTrack) return Promise.reject(new Error('Get Track Analysis Failed'));

  return Promise.resolve({
    body: {
      sections: section_props.map((section) => {
        let s = Object.assign({ duration: 10.5 }, section);
        s = Object.assign(s, { start: s.start_ms / 1000 });
        delete s.start_ms;
        delete s.end_ms;
        return s;
      }),
    },
  });
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
      getAudioAnalysisForTrack,
    };
  });
}
