import { assert } from 'chai';
import getTrackSections from '../../src/generate_mashup/get_track_sections';

import { compareSectionProps } from './generate_mashup_utils.test';
import { section_props, stubSpotifyAPI, throwError } from './stub_spotify_api.test';
import { arraysMatchUnordered } from '../test_utils/assertions/arrays_match.test';

describe('Get Tracks Sections', () => {
  beforeEach(function () {
    this.access_token = 'valid_token';

    stubSpotifyAPI(this.access_token);
  });

  it('should get sections of track', async function () {
    const sections = await getTrackSections('some_track_id', this.access_token);

    arraysMatchUnordered(sections, section_props, 'Section Properties', compareSectionProps);
  });

  it('should throw error if api returns error', async function () {
    throwError({ getAlbum: false, getAlbumTracks: false, getPlaylist: false, getAudioAnalysisForTrack: true });
    await assert.isRejected(getTrackSections('some_track_id', this.access_token), 'Get Track Analysis Failed');
  });
});
