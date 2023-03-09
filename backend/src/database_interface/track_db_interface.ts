import RemixDBInterface from './remix_db_interface';

/**
 * TrackDBInterface() - Partial definition of DatabaseInterface
 * Handles adding/removing/fetching tracks
 */
export default class TrackDBInterface extends RemixDBInterface {
  /**
   * getRemixTracks() - gets all tracks of a remix
   * @param remix_id - unique remix id
   * @returns Promise resolving to array of spotify track ids (rejected if an error occures)
   */
  async getRemixTracks(remix_id: string): Promise<Array<string>> {
    await this.remixExists(remix_id);

    const rows = (await this.dbAll(
      'SELECT track_id FROM tracks WHERE remix_id = $remix_id;',
      {
        $remix_id: remix_id,
      }
    )) as Array<{ track_id: string; remix_id: string }>;

    const result = rows.map((a) => a.track_id);
    return result;
  }

  /**
   * addTrack() - adds a track from remix ensuring no repeats in a remix
   * Note: Aside from blank track_id, the validity of track_id is not checked! (check with spotify first!)
   * @param remix_id - unique remix id
   * @param track_id - spotify track id of track to add to remix
   * @returns Promise resolving to nothing if remix id and track id are valid (rejected if an error occurs)
   */
  async addTrack(remix_id: string, track_id: string): Promise<void> {
    // check for invalid track_id
    if (this.isEmpty(track_id)) {
      this.log_.debug(
        `track_id ${track_id} was empty, refusing to create new track`
      );
      return Promise.reject(new Error('Invalid Track Id'));
    }

    // get remixes tracks (also makes sure remix exists)
    const tracks = await this.getRemixTracks(remix_id);

    // check that track_id is not already in remix
    if (tracks.includes(track_id)) {
      this.log_.debug(
        `track_id ${track_id} exists in remix already, refusing to create new track`
      );
      return Promise.reject(new Error('Track Id Exists In Remix'));
    }

    await this.dbRun('INSERT INTO tracks VALUES ($remix_id, $track_id);', {
      $remix_id: remix_id,
      $track_id: track_id,
    });
  }

  /**
   * removeTrack() - removes a track from remix
   * @param remix_id - unique remix id
   * @param track_id - spotify track id of track to remove from remix
   * @returns Promise resolving to nothing if remix id and track id are valid (rejected if an error occurs)
   */
  async removeTrack(remix_id: string, track_id: string): Promise<void> {
    this.log_.debug(
      `Removing track with track_id ${track_id} for remix with remix_id ${remix_id}`
    );

    // get remixes tracks (also makes sure remix exists)
    const tracks = await this.getRemixTracks(remix_id);

    // check that track_id is not already in remix
    if (!tracks.includes(track_id)) {
      return Promise.reject(new Error('Invalid Track Id'));
    }

    await this.dbRun(
      'DELETE FROM tracks WHERE track_id = $track_id AND remix_id = $remix_id;',
      {
        $remix_id: remix_id,
        $track_id: track_id,
      }
    );
  }

  /**
   * totalTrackCount() - gets number of tracks in database
   * @returns Promise resolving to number of tracks in database (rejected if an error occurs)
   */
  async totalTrackCount(): Promise<number> {
    const rows = (await this.dbAll(
      'SELECT COUNT(1) FROM tracks;',
      {}
    )) as Array<{ 'COUNT(1)': number }>;
    return rows[0]['COUNT(1)'];
  }
}
