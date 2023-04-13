import { SpotifyAPI } from '../spotify_authentication/spotify_api_import';

import { spotify_api_config } from '../config/config';

// Spotify Track Section Properties (refer to spotify api docs)
export type SectionProps = {
  start: number;
  end: number;
  loudness: number;
  tempo: number;
  key: number;
  mode: number;
  time_signature: number;
};

/**
 * getTrackSections() - Gets the section properites of a track
 * @param track_id - spotify track_id of track to get sections of
 * @param access_token - spotify api access token
 * @returns Promise resolving to array section properties
 */
export default async function getTrackSections(track_id: string, access_token: string): Promise<Array<SectionProps>> {
  const spotify_api = new SpotifyAPI({
    clientId: spotify_api_config.client_id,
    clientSecret: spotify_api_config.client_secret,
    redirectUri: spotify_api_config.redirect_url,
  });
  spotify_api.setAccessToken(access_token);

  const analysis = await spotify_api.getAudioAnalysisForTrack(track_id);

  return analysis.body.sections.map((section) => {
    return {
      start: section.start,
      end: section.start + section.duration,
      loudness: section.loudness,
      tempo: section.tempo,
      key: section.key,
      mode: section.mode,
      time_signature: section.time_signature,
    };
  });
}
