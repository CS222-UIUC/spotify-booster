// Spotify Track Section Properties (refer to spotify api docs)
export type SectionProps = {
  start: number;
  duration: number;
  loudness: number;
  tempo: number;
  key: number;
  mode: number;
  time_signature: number;
};

/**
 *
 * @param track_id - spotify track_id of track to get sections of
 * @param access_token - spotify api access token
 * @returns Promise resolving to array of section properties
 */
export default async function GetTrackSections(track_id: string, access_token: string): Promise<Array<SectionProps>> {
  return Promise.resolve([]);
}
