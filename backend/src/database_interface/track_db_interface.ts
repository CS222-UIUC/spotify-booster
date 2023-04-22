import MashupDBInterface from './mashup_db_interface';

export type TrackInfo = {
  track_id: string; // spotify track_id
  start_ms: number; // start time of track in milliseconds
  end_ms: number; // end time of track in milliseconds (-1 indicates playing to end)
};

/**
 * TrackDBInterface() - Partial definition of DatabaseInterface
 * Handles adding/removing/fetching tracks
 */
export default class TrackDBInterface extends MashupDBInterface {
  /**
   * mashupIncludesTrack() - check if a mashup includes a track
   * @param mashup_id - mashup_id to check
   * @param track_id - track_id to check
   * @returns Promise resolving to if mashup includes track or not
   */
  private async mashupIncludesTrack(mashup_id: string, track_id: string): Promise<boolean> {
    const results = (await this.dbAll('SELECT COUNT(1) FROM tracks WHERE mashup_id = $mashup_id AND track_id = $track_id', {
      $mashup_id: mashup_id,
      $track_id: track_id,
    })) as Array<{ 'COUNT(1)': number }>;

    return results[0]['COUNT(1)'] > 0;
  }

  /**
   * assertTrackExists() - checks if mashup exists, track_id is not empty, and mashup includes the track, throws error otherwise
   * @param mashup_id - mashup_id to check
   * @param track_id - track_id to check
   * @returns Promise that resolves once checked
   */
  protected async assertTrackExists(mashup_id: string, track_id: string): Promise<void> {
    await this.assertMashupExists(mashup_id);
    if (this.isEmpty(track_id)) throw new Error('Invalid Track Id');
    if (!(await this.mashupIncludesTrack(mashup_id, track_id))) {
      throw new Error('Track Does Not Exist In Mashup');
    }
  }

  /**
   * getMashupTracks() - gets all tracks of a mashup
   * @param mashup_id - unique mashup id
   * @returns Promise resolving to array of spotify track ids (rejected if an error occures)
   */
  async getMashupTracks(mashup_id: string): Promise<Array<TrackInfo>> {
    await this.assertMashupExists(mashup_id);

    const rows = (await this.dbAll(
      'SELECT track_id, start_ms, end_ms FROM tracks WHERE mashup_id = $mashup_id ORDER BY "index" ASC;',
      {
        $mashup_id: mashup_id,
      }
    )) as Array<TrackInfo>;

    return rows;
  }

  /**
   * addTrack() - adds a track from mashup ensuring no repeats in a mashup
   * Note: Aside from blank track_id, the validity of track_id is not checked! (check with spotify first!)
   * @param mashup_id - unique mashup id
   * @param track_id - spotify track id of track to add to mashup
   * @param index - index in mashup of track
   * @returns Promise resolving to nothing if mashup id and track id are valid (rejected if an error occurs)
   */
  async addTrack(mashup_id: string, track_id: string, index: number): Promise<void> {
    // check for invalid track_id
    if (this.isEmpty(track_id)) {
      this.log_.debug(`track_id ${track_id} was empty, refusing to create new track`);
      throw new Error('Invalid Track Id');
    }

    // check that track_id is not already in mashup
    await this.assertMashupExists(mashup_id);
    if (await this.mashupIncludesTrack(mashup_id, track_id)) {
      this.log_.debug(`track_id ${track_id} exists in mashup already, refusing to create new track`);
      throw new Error('Track Id Exists In Mashup');
    }

    await this.dbRun('INSERT INTO tracks VALUES ($mashup_id, $track_id, $index, 0, -1)', {
      $mashup_id: mashup_id,
      $track_id: track_id,
      $index: index,
    });
  }

  /**
   * setStartMS() - sets the start_ms property of a track in a mashup
   * @param mashup_id - unique mashup id
   * @param track_id - spotify track id of track to update
   * @param start_ms - new start_ms value
   */
  async setStartMS(mashup_id: string, track_id: string, start_ms: number): Promise<void> {
    if (start_ms < 0) throw new Error('start_ms cannot be negative');

    await this.assertTrackExists(mashup_id, track_id);

    await this.dbRun('UPDATE tracks SET start_ms = $start_ms WHERE mashup_id = $mashup_id AND track_id = $track_id', {
      $start_ms: start_ms,
      $mashup_id: mashup_id,
      $track_id: track_id,
    });
  }

  /**
   * setEndMS() - sets the end_ms property of a track in a mashup
   * @param mashup_id - unique mashup id
   * @param track_id - spotify track id of track to update
   * @param end_ms - new end_ms value
   */
  async setEndMS(mashup_id: string, track_id: string, end_ms: number): Promise<void> {
    if (end_ms < -1) throw new Error('end_ms cannot be less than -1');

    await this.assertTrackExists(mashup_id, track_id);

    await this.dbRun('UPDATE tracks SET end_ms = $end_ms WHERE mashup_id = $mashup_id AND track_id = $track_id', {
      $end_ms: end_ms,
      $mashup_id: mashup_id,
      $track_id: track_id,
    });
  }

  /**
   * removeTrack() - removes a track from mashup
   * @param mashup_id - unique mashup id
   * @param track_id - spotify track id of track to remove from mashup
   * @returns Promise resolving to nothing if mashup id and track id are valid (rejected if an error occurs)
   */
  async removeTrack(mashup_id: string, track_id: string): Promise<void> {
    this.log_.debug(`Removing track with track_id ${track_id} for mashup with mashup_id ${mashup_id}`);

    await this.assertTrackExists(mashup_id, track_id);

    await this.dbRun('DELETE FROM tracks WHERE track_id = $track_id AND mashup_id = $mashup_id;', {
      $mashup_id: mashup_id,
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
