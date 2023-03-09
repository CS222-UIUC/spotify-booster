import crypto from 'crypto';

import SQLiteInterface from './sqlite_interface';

/**
 * RemixDBInterface() - Partial definition of DatabaseInterface
 * Handles creating/editing/deleting remixes
 */
export default class RemixDBInterface extends SQLiteInterface {
  // unlikely that 10 new remixes will be created every millisecond, so this should guarantee a unique remix_id
  private remix_id_gen_ = Date.now() * 10;

  /**
   * generateRemixId_() - generates a unique remix id each time it is called
   * @returns - a unique remix id
   */
  private generateRemixId_(): string {
    this.remix_id_gen_++;
    return crypto
      .createHash('sha256')
      .update(this.remix_id_gen_.toString())
      .digest('base64url');
  }

  /**
   * isEmpty() - checks if a string is empty or only contains whitespace
   * @param str - string to check
   * @returns - if string is empty or not
   */
  protected isEmpty(str: string): boolean {
    return (
      str === null ||
      str === undefined ||
      str.match(/^\s*$/) !== null ||
      str === ''
    );
  }

  /**
   * remixExists() - Checks if a remix exists in the database
   * @param remix_id - unique remix id
   * @returns - Promise that resolves if remix exists, throws error if not
   */
  protected async remixExists(remix_id: string): Promise<void> {
    try {
      await this.getRemixName(remix_id);
    } catch {
      this.log_.warn(`${remix_id} was not a valid remix_id`);
      return Promise.reject(new Error('Invalid Remix Id'));
    }
  }

  /**
   * createRemix() - creates a new empty remix
   * @param name - name of remix
   * @returns Promise resolving to unique remix id (rejected if an error occurs)
   */
  async createRemix(name: string): Promise<string> {
    const remix_id = this.generateRemixId_();
    this.log_.debug(
      `Creating new remix with name ${name} and remix_id ${remix_id}`
    );

    // check for invalid name
    if (this.isEmpty(name)) {
      this.log_.debug(`name ${name} was empty, refusing to create new remix`);
      return Promise.reject(new Error('Invalid Remix Name'));
    }

    await this.dbRun('INSERT INTO remixes VALUES ($remix_id, $name);', {
      $remix_id: remix_id,
      $name: name.trim(), // make sure to trim name
    });

    return remix_id;
  }

  /**
   * getRemixName() - gets the name of a remix
   * @param remix_id - unique remix id
   * @returns Promise resolving to remix name (rejected if an error occurs)
   */
  async getRemixName(remix_id: string): Promise<string> {
    // fetch from database
    const rows = (await this.dbAll(
      'SELECT name FROM remixes WHERE remix_id = $remix_id;',
      {
        $remix_id: remix_id,
      }
    )) as Array<{ name: string; remix_id: string }>;

    // reject if no remixes found
    if (rows.length === 0) {
      this.log_.warn(
        `Remix with remix_id ${remix_id} not found, assuming invalid remix_id`
      );
      return Promise.reject(new Error('Invalid Remix Id'));
    }

    return rows[0].name;
  }

  /**
   * setRemixName() - updates the name of a remix
   * @param remix_id - unique remix id
   * @param new_name - new remix name
   * @returns Promise resolving to nothing if remix id is valid (rejected if an error occurs)
   */
  async setRemixName(remix_id: string, new_name: string): Promise<void> {
    this.log_.debug(
      `Updating remix with remix_id ${remix_id} with name ${new_name}`
    );

    await this.remixExists(remix_id);

    // check for invalid name
    if (this.isEmpty(new_name)) {
      this.log_.debug(`name ${new_name} was empty, refusing to update remix`);
      return Promise.reject(new Error('Invalid Remix Name'));
    }

    await this.dbRun(
      'UPDATE remixes SET name = $name WHERE remix_id = $remix_id;',
      {
        $remix_id: remix_id,
        $name: new_name.trim(), // make sure to trim name
      }
    );
  }

  /**
   * deleteRemix() - deletes a remix
   * @param remix_id - unique remix id
   * @returns Promise resolving to nothing if remix id is valid (rejected if an error occurs)
   */
  async deleteRemix(remix_id: string): Promise<void> {
    this.log_.debug(`Deleting remix with remix_id ${remix_id}`);

    await this.remixExists(remix_id);

    await this.dbRun('DELETE FROM remixes WHERE remix_id = $remix_id;', {
      $remix_id: remix_id,
    });
  }

  /**
   * remixCount() - gets number of remixes in database
   * @returns Promise resolving to number of remixes in database (rejected if an error occurs)
   */
  async remixCount(): Promise<number> {
    const rows = (await this.dbAll(
      'SELECT COUNT(1) FROM remixes;',
      {}
    )) as Array<{ 'COUNT(1)': number }>;
    return rows[0]['COUNT(1)'];
  }
}
