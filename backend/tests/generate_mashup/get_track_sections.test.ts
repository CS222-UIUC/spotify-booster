import { assert } from 'chai';
import getTrackSections from '../../src/generate_mashup/get_track_sections';

import { compareSectionProps, section_props, stubSpotifyAPI, throwError } from './generate_mashup_utils.test';
import { arraysMatchUnordered } from '../test_utils/assertions/arrays_match.test';

describe('Get Tracks Sections', () => {
  beforeEach(function () {
    this.access_token = 'valid_token';

    stubSpotifyAPI(this.access_token);
  });

  it('should get tracks of empty album', async function () {
    const sections = await getTrackSections('some_track_id', this.access_token);

    arraysMatchUnordered(sections, section_props, 'Section Properties', compareSectionProps);
  });

  it('should throw error if api returns error', async function () {
    throwError({ getAlbum: false, getAlbumTracks: false, getPlaylist: false, getAudioAnalysisForTrack: true });
    assert.isRejected(getTrackSections('some_track_id', this.access_token), 'Get Track Analysis Failed');
  });
});
