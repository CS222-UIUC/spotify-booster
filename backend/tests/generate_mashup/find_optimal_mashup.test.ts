import { assert } from 'chai';

import findOptimalMashup from '../../src/generate_mashup/find_optimal_mashup';
import { arraysMatchUnordered } from '../test_utils/assertions/arrays_match.test';
import { track_ids, section_info } from './find_optimal_mashup_data.test';
import { trackInfoSectionExists } from './generate_mashup_utils.test';

describe('Find Optimal Mashup', () => {
  it('find mashup containing all tracks', async () => {
    const optimal = await findOptimalMashup(track_ids[3], track_ids, section_info);
    const optimal_tracks_ids = optimal.map((x) => x.track_id);
    arraysMatchUnordered(optimal_tracks_ids, track_ids, 'Track Ids');

    for (const track of optimal) {
      assert(trackInfoSectionExists(track_ids, section_info, track), 'Track info is valid');
    }
  });
});
