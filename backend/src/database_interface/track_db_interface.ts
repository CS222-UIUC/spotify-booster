import RemixDBInterface from './remix_db_interface';

export type TrackInfo = {
  track_id: string; // spotify track_id
  start_ms: number; // start time of track in milliseconds
  end_ms: number; // end time of track in milliseconds (-1 indicates playing to end)
};

/**
 * TrackDBInterface() - Partial definition of DatabaseInterface
 * Handles adding/removing/fetching tracks
 */
export default class TrackDBInterface extends RemixDBInterface {
  /**
   * remixIncludesTrack() - check if a remix includes a track
   * @param remix_id - remix_id to check
   * @param track_id - track_id to check
   * @returns Promise resolving to if remix includes track or not
   */
  private async remixIncludesTrack(remix_id: string, track_id: string): Promise<boolean> {
    const results = (await this.dbAll('SELECT COUNT(1) FROM tracks WHERE remix_id = $remix_id AND track_id = $track_id', {
      $remix_id: remix_id,
      $track_id: track_id,
    })) as Array<{ 'COUNT(1)': number }>;

    return results[0]['COUNT(1)'] > 0;
  }

  /**
   * getRemixTracks() - gets all tracks of a remix
   * @param remix_id - unique remix id
   * @returns Promise resolving to array of spotify track ids (rejected if an error occures)
   */
  async getRemixTracks(remix_id: string): Promise<Array<TrackInfo>> {
    await this.remixExists(remix_id);

    const rows = (await this.dbAll('SELECT track_id, start_ms, end_ms FROM tracks WHERE remix_id = $remix_id;', {
      $remix_id: remix_id,
    })) as Array<TrackInfo>;

    return rows;
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
      this.log_.debug(`track_id ${track_id} was empty, refusing to create new track`);
      return Promise.reject(new Error('Invalid Track Id'));
    }

    // check that track_id is not already in remix
    await this.remixExists(remix_id);
    if (await this.remixIncludesTrack(remix_id, track_id)) {
      this.log_.debug(`track_id ${track_id} exists in remix already, refusing to create new track`);
      return Promise.reject(new Error('Track Id Exists In Remix'));
    }

    await this.dbRun('INSERT INTO tracks VALUES ($remix_id, $track_id, 0, -1);', {
      $remix_id: remix_id,
      $track_id: track_id,
    });
  }

  /**
   * setStartMS() - sets the start_ms property of a track in a remix
   * @param remix_id - unique remix id
   * @param track_id - spotify track id of track to update
   * @param start_ms - new start_ms value
   */
  async setStartMS(remix_id: string, track_id: string, start_ms: number): Promise<void> {
    if (start_ms < 0) throw new Error('start_ms cannot be negative');

    // check that track_id is in remix
    await this.remixExists(remix_id);
    if (!(await this.remixIncludesTrack(remix_id, track_id))) {
      return Promise.reject(new Error('Invalid Track Id'));
    }

    await this.dbRun('UPDATE tracks SET start_ms = $start_ms WHERE remix_id = $remix_id AND track_id = $track_id', {
      $start_ms: start_ms,
      $remix_id: remix_id,
      $track_id: track_id,
    });
  }

  /**
   * setEndMS() - sets the end_ms property of a track in a remix
   * @param remix_id - unique remix id
   * @param track_id - spotify track id of track to update
   * @param end_ms - new end_ms value
   */
  async setEndMS(remix_id: string, track_id: string, end_ms: number): Promise<void> {
    if (end_ms < -1) throw new Error('end_ms cannot be less than -1');
    // check that track_id is in remix
    await this.remixExists(remix_id);
    if (!(await this.remixIncludesTrack(remix_id, track_id))) {
      return Promise.reject(new Error('Invalid Track Id'));
    }

    await this.dbRun('UPDATE tracks SET end_ms = $end_ms WHERE remix_id = $remix_id AND track_id = $track_id', {
      $end_ms: end_ms,
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
    this.log_.debug(`Removing track with track_id ${track_id} for remix with remix_id ${remix_id}`);

    // check that track_id is in remix
    await this.remixExists(remix_id);
    if (!(await this.remixIncludesTrack(remix_id, track_id))) {
      return Promise.reject(new Error('Invalid Track Id'));
    }

    await this.dbRun('DELETE FROM tracks WHERE track_id = $track_id AND remix_id = $remix_id;', {
      $remix_id: remix_id,
      $track_id: track_id,
    });
  }

  /**
   * totalTrackCount() - gets number of tracks in database
   * @returns Promise resolving to number of tracks in database (rejected if an error occurs)
   */
  async totalTrackCount(): Promise<number> {
    const rows = (await this.dbAll('SELECT COUNT(1) FROM tracks;', {})) as Array<{ 'COUNT(1)': number }>;
    return rows[0]['COUNT(1)'];
  }
}
