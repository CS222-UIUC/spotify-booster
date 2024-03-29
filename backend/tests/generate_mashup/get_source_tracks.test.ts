import { assert } from 'chai';

import { SourceType } from '../../src/generate_mashup/generate_mashup';
import getSourceTracks from '../../src/generate_mashup/get_source_tracks';

import {
  long_album_tracks,
  long_playlist_tracks,
  short_album_tracks,
  short_playlist_tracks,
  stubSpotifyAPI,
  throwError,
} from './stub_spotify_api.test';
import { arraysMatchUnordered } from '../test_utils/assertions/arrays_match.test';

describe('Get Source Tracks', () => {
  beforeEach(function () {
    this.access_token = 'valid_token';

    stubSpotifyAPI(this.access_token);
  });

  describe('Get Album Tracks', () => {
    it('should get tracks of empty album', async function () {
      const tracks = await getSourceTracks('empty_album_id', SourceType.Album, this.access_token);

      assert.equal(tracks.length, 0, 'Returns empty list');
    });

    it('should get tracks of short album', async function () {
      const tracks = await getSourceTracks('short_album_id', SourceType.Album, this.access_token);

      arraysMatchUnordered(tracks, short_album_tracks, 'Short Album Tracks');
    });

    it('should get tracks of long album', async function () {
      const tracks = await getSourceTracks('long_album_id', SourceType.Album, this.access_token);

      arraysMatchUnordered(tracks, long_album_tracks, 'Long Album Tracks');
    });
  });

  describe('Get Playlist Tracks', () => {
    it('should get tracks of empty playlist', async function () {
      const tracks = await getSourceTracks('empty_playlist_id', SourceType.Playlist, this.access_token);

      assert.equal(tracks.length, 0, 'Returns empty list');
    });

    it('should get tracks of short playlist', async function () {
      const tracks = await getSourceTracks('short_playlist_id', SourceType.Playlist, this.access_token);

      arraysMatchUnordered(tracks, short_playlist_tracks, 'Short Playlist Tracks');
    });

    it('should get tracks of long playlist', async function () {
      const tracks = await getSourceTracks('long_playlist_id', SourceType.Playlist, this.access_token);

      arraysMatchUnordered(tracks, long_playlist_tracks, 'Short Playlist Tracks');
    });
  });

  describe('Unknown Source Type', () => {
    it('should throw error with invalid source type', async function () {
      assert.isRejected(getSourceTracks('empty_playlist_id', 10 as SourceType, this.access_token), 'Source Type Invalid');
    });
  });

  describe('API Errors', () => {
    it('should throw error if api returns error', async function () {
      throwError({
        getAlbum: true,
        getAlbumTracks: false,
        getPlaylist: false,
        getPlaylistTracks: false,
        getAudioAnalysisForTrack: false,
      });
      await assert.isRejected(getSourceTracks('long_album_id', SourceType.Album, this.access_token), 'Get Album Failed');

      throwError({
        getAlbum: false,
        getAlbumTracks: true,
        getPlaylist: false,
        getPlaylistTracks: false,
        getAudioAnalysisForTrack: false,
      });
      await assert.isRejected(
        getSourceTracks('long_album_id', SourceType.Album, this.access_token),
        'Get Album Tracks Failed'
      );

      throwError({
        getAlbum: false,
        getAlbumTracks: false,
        getPlaylist: true,
        getPlaylistTracks: false,
        getAudioAnalysisForTrack: false,
      });
      await assert.isRejected(
        getSourceTracks('long_playlist_id', SourceType.Playlist, this.access_token),
        'Get Playlist Failed'
      );

      throwError({
        getAlbum: false,
        getAlbumTracks: false,
        getPlaylist: false,
        getPlaylistTracks: true,
        getAudioAnalysisForTrack: false,
      });
      await assert.isRejected(
        getSourceTracks('long_playlist_id', SourceType.Playlist, this.access_token),
        'Get Playlist Tracks Failed'
      );
    });
  });
});
