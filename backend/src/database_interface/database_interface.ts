import { Database, verbose } from 'sqlite3';
const sqlite3 = verbose();
import crypto from 'crypto';
import fs from 'fs-extra';

import Logger from '../logger/logger';

/**
 * DatabaseInterface()
 * SQLite Abstraction
 * Contains methods for Creating/Deleting/Editing User Remixes the tracks they contain
 */
export default class DatabaseInterface {
  // unlikely that 10 new remixes will be created every millisecond, so this should guarantee a unique remix_id
  private remix_id_gen_ = Date.now() * 10;
  private log_: Logger;
  private db_: Database;
  private ready_: Promise<void>;

  /**
   * @param database_path - path to the .db file
   */
  constructor(database_path: string) {
    this.log_ = new Logger('Database');
    this.initializeDatabase_(database_path);

    this.ready_.catch((error) => {
      throw error;
    });
  }

  /**
   * createRemix() - creates a new empty remix
   * @param name - name of remix
   * @returns Promise resolving to unique remix id (rejected if an error occurs)
   */
  async createRemix(name: string): Promise<string> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      const profile = this.log_.profile('Create Remix');

      if (this.isEmpty(name)) {
        this.log_.debug(`name ${name} was empty, refusing to create new remix`);
        profile.stop({
          level_thresholds: { debug: 0, warn: 1000, error: 5000 },
        });
        reject(new Error('Invalid Remix Name'));
        return;
      }

      const remix_id = this.generateRemixId_();
      this.log_.debug(
        `Creating new remix with name ${name} and remix_id ${remix_id}`
      );

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      // run commands in series
      this.db_.serialize(() => {
        this.db_.run(
          'INSERT INTO remixes VALUES ($remix_id, $name);',
          {
            $remix_id: remix_id,
            $name: name.trim(), // make sure to trim name
          },
          function (error) {
            profile.stop({
              level_thresholds: { debug: 0, warn: 1000, error: 5000 },
            });

            if (error) {
              self.log_.error(
                `Error while creating remix with name ${name}`,
                error
              );
              reject(error);
              return;
            }

            // if no changes are made, assume creating remix failed
            if (this.changes === 0) {
              self.log_.warn(
                `Creating new remix with name ${name} and remix_id ${remix_id} failed because it resulted in no changes`
              );
              reject(new Error('Unknown Error: Remix Not Successfully Saved'));
              return;
            }

            self.log_.info(
              `Created new remix with name ${name} and remix_id ${remix_id}`
            );
            resolve(remix_id);
          }
        );
      });
    });
  }

  /**
   * getRemixName() - gets the name of a remix
   * @param remix_id - unique remix id
   * @returns Promise resolving to remix name (rejected if an error occurs)
   */
  async getRemixName(remix_id: string): Promise<string> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      const profile = this.log_.profile('Get Remix Name');

      // run commands in series
      this.db_.serialize(() => {
        this.db_.get(
          'SELECT name FROM remixes WHERE remix_id = $remix_id;',
          {
            $remix_id: remix_id,
          },
          (error, row) => {
            profile.stop({
              level_thresholds: { debug: 0, warn: 1000, error: 5000 },
            });

            if (error) {
              this.log_.error(
                `Error while fetching remix with remix_id ${remix_id}`,
                error
              );
              reject(error);
              return;
            }

            // reject if no remixes found
            if (!row) {
              this.log_.warn(
                `Remix with remix_id ${remix_id} not found, assuming invalid remix_id`
              );
              reject(new Error('Invalid Remix Id'));
              return;
            }

            resolve(row['name']);
          }
        );
      });
    });
  }

  /**
   * setRemixName() - updates the name of a remix
   * @param remix_id - unique remix id
   * @param new_name - new remix name
   * @returns Promise resolving to nothing if remix id is valid (rejected if an error occurs)
   */
  async setRemixName(remix_id: string, new_name: string): Promise<void> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      const profile = this.log_.profile('Set Remix Name');

      if (this.isEmpty(new_name)) {
        this.log_.debug(`name ${new_name} was empty, refusing to update remix`);
        profile.stop({
          level_thresholds: { debug: 0, warn: 1000, error: 5000 },
        });
        reject(new Error('Invalid Remix Name'));
        return;
      }

      this.log_.debug(
        `Updating remix with remix_id ${remix_id} with name ${new_name}`
      );

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      // run commands in series
      this.db_.serialize(() => {
        this.db_.run(
          'UPDATE remixes SET name = $name WHERE remix_id = $remix_id;',
          {
            $remix_id: remix_id,
            $name: new_name.trim(), // make sure to trim name
          },
          function (error) {
            profile.stop({
              level_thresholds: { debug: 0, warn: 1000, error: 5000 },
            });

            if (error) {
              self.log_.error(
                `Error while updating remix with remix_id ${remix_id} with name ${new_name}`,
                error
              );
              reject(error);
              return;
            }

            // if no changes are made, assume invalid remix_id
            if (this.changes === 0) {
              self.log_.debug(
                `Updating remix with remix_id ${remix_id} with name ${new_name} resulted in no changes, assuming invalid remix_id`
              );
              reject(new Error('Invalid Remix Id'));
              return;
            }

            self.log_.info(
              `Updated remix with remix_id ${remix_id} with name ${new_name}`
            );
            resolve();
          }
        );
      });
    });
  }

  /**
   * deleteRemix() - deletes a remix
   * @param remix_id - unique remix id
   * @returns Promise resolving to nothing if remix id is valid (rejected if an error occurs)
   */
  async deleteRemix(remix_id: string): Promise<void> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      const profile = this.log_.profile('Delete Remix');
      this.log_.debug(`Deleting remix with remix_id ${remix_id}`);

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      // run commands in series
      this.db_.serialize(() => {
        this.db_.run(
          'DELETE FROM remixes WHERE remix_id = $remix_id;',
          {
            $remix_id: remix_id,
          },
          function (error) {
            profile.stop({
              level_thresholds: { debug: 0, warn: 1000, error: 5000 },
            });

            if (error) {
              self.log_.error(
                `Error while deleting remix with remix_id ${remix_id}`,
                error
              );
              reject(error);
              return;
            }

            // if no changes are made, assume invalid remix_id
            if (this.changes === 0) {
              self.log_.debug(
                `Deleting remix with remix_id ${remix_id} resulted in no changes, assuming invalid remix_id`
              );
              reject(new Error('Invalid Remix Id'));
              return;
            }

            self.log_.info(`Deleted remix with remix_id ${remix_id}`);
            resolve();
          }
        );
      });
    });
  }

  /**
   * getRemixTracks() - gets all tracks of a remix
   * @param remix_id - unique remix id
   * @returns Promise resolving to array of spotify track ids (rejected if an error occures)
   */
  async getRemixTracks(remix_id: string): Promise<Array<string>> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      const profile = this.log_.profile('Get Remix Tracks');
      this.log_.debug(`Getting tracks for remix with remix_id ${remix_id}`);

      // check that remix_id is valid
      this.getRemixName(remix_id)
        .then(() => {
          // run commands in series
          this.db_.serialize(() => {
            this.db_.all(
              'SELECT track_id FROM tracks WHERE remix_id = $remix_id;',
              {
                $remix_id: remix_id,
              },
              (error, rows) => {
                const tracks = [];
                if (rows) {
                  for (const row of rows) {
                    tracks.push(row['track_id']);
                  }
                }

                profile.stop({
                  level_thresholds: { debug: 0, warn: 1000, error: 5000 },
                });

                if (error) {
                  this.log_.error(
                    `Error while getting tracks for remix with remix_id ${remix_id}`,
                    error
                  );
                  reject(error);
                  return;
                }

                this.log_.info(
                  `Got ${tracks.length} tracks for remix with remix_id ${remix_id}`
                );
                resolve(tracks);
              }
            );
          });
        })
        // reject if there was an error fetching name (could be that remix_id is valid or something else, both need to be thrown)
        .catch((error) => {
          profile.stop({
            level_thresholds: { debug: 0, warn: 1000, error: 5000 },
          });
          reject(error);
        });
    });
  }

  /**
   * addTrack() - adds a track from remix ensuring no repeats in a remix
   * Note: Aside from blank track_id, the validity of track_id is not checked! (check with spotify first!)
   * @param remix_id - unique remix id
   * @param track_id - spotify track id of track to add to remix
   * @returns Promise resolving to nothing if remix id and track id are valid (rejected if an error occurs)
   */
  async addTrack(remix_id: string, track_id: string): Promise<void> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      const profile = this.log_.profile('Add Track');

      // check that remix exists first
      this.getRemixTracks(remix_id)
        .then((tracks) => {
          if (this.isEmpty(track_id)) {
            this.log_.debug(
              `track_id ${track_id} was empty, refusing to create new track`
            );
            profile.stop({
              level_thresholds: { debug: 0, warn: 1000, error: 5000 },
            });
            reject(new Error('Invalid Track Id'));
            return;
          }

          if (tracks.includes(track_id)) {
            this.log_.debug(
              `track_id ${track_id} exists in remix already, refusing to create new track`
            );
            profile.stop({
              level_thresholds: { debug: 0, warn: 1000, error: 5000 },
            });
            reject(new Error('Track Id Exists In Remix'));
            return;
          }

          this.log_.debug(
            `Creating new track with track_id ${track_id} and remix_id ${remix_id}`
          );

          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const self = this;
          // run commands in series
          this.db_.serialize(() => {
            this.db_.run(
              'INSERT INTO tracks VALUES ($remix_id, $track_id);',
              {
                $remix_id: remix_id,
                $track_id: track_id,
              },
              function (error) {
                profile.stop({
                  level_thresholds: { debug: 0, warn: 1000, error: 5000 },
                });

                if (error) {
                  self.log_.error(
                    `Error while creating track with track_id ${track_id} and remix_id ${remix_id}`,
                    error
                  );
                  reject(error);
                  return;
                }

                // if no changes are made, assume creating remix failed
                if (this.changes === 0) {
                  self.log_.warn(
                    `Creating new track with track_id ${track_id} and remix_id ${remix_id} failed because it resulted in no changes`
                  );
                  reject(
                    new Error('Unknown Error: Remix Not Successfully Saved')
                  );
                  return;
                }

                self.log_.info(
                  `Created new track with track_id ${track_id} and remix_id ${remix_id}`
                );
                resolve();
              }
            );
          });
        })
        // reject if there was an error fetching name (could be that remix_id is valid or something else, both need to be thrown)
        .catch((error) => {
          profile.stop({
            level_thresholds: { debug: 0, warn: 1000, error: 5000 },
          });
          reject(error);
        });
    });
  }

  /**
   * removeTrack() - removes a track from remix
   * @param remix_id - unique remix id
   * @param track_id - spotify track id of track to remove from remix
   * @returns Promise resolving to nothing if remix id and track id are valid (rejected if an error occurs)
   */
  async removeTrack(remix_id: string, track_id: string): Promise<void> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      const profile = this.log_.profile('Remove Remix Track');

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      // check that remix_id is valid
      this.getRemixName(remix_id)
        .then(() => {
          this.log_.debug(
            `Removing track with track_id ${track_id} for remix with remix_id ${remix_id}`
          );

          // run commands in series
          this.db_.serialize(() => {
            this.db_.run(
              'DELETE FROM tracks WHERE track_id = $track_id AND remix_id = $remix_id;',
              {
                $remix_id: remix_id,
                $track_id: track_id,
              },
              function (error) {
                profile.stop({
                  level_thresholds: { debug: 0, warn: 1000, error: 5000 },
                });

                if (error) {
                  self.log_.error(
                    `Error while removing track with track_id ${track_id} for remix with remix_id ${remix_id}`,
                    error
                  );
                  reject(error);
                  return;
                }

                // if no changes are made, assume invalid track_id
                if (this.changes === 0) {
                  self.log_.debug(
                    `Deleting track with track_id ${track_id} with remix_id ${remix_id} resulted in no changes, assuming invalid track_id`
                  );
                  reject(new Error('Invalid Track Id'));
                  return;
                }

                self.log_.info(
                  `Removed track with track_id ${track_id} for remix with remix_id ${remix_id}`
                );
                resolve();
              }
            );
          });
        })
        // reject if there was an error fetching name (could be that remix_id is valid or something else, both need to be thrown)
        .catch((error) => {
          profile.stop({
            level_thresholds: { debug: 0, warn: 1000, error: 5000 },
          });
          reject(error);
        });
    });
  }

  /**
   * remixCount() - gets number of remixes in database
   * @returns Promise resolving to number of remixes in database (rejected if an error occurs)
   */
  async remixCount(): Promise<number> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      // run commands in series
      this.db_.serialize(() => {
        this.db_.get('SELECT COUNT(1) FROM remixes;', (error, row) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(row['COUNT(1)']);
        });
      });
    });
  }

  /**
   * close() - releases lock on database after finishing all queued operations
   * @returns Promise resolving to nothing (rejected if an error occurs)
   */
  async close(): Promise<void> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      this.db_.close((error) => {
        if (error) {
          this.log_.error('Error while closing database', error);
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  /**
   * totalTrackCount() - gets number of tracks in database
   * @returns Promise resolving to number of tracks in database (rejected if an error occurs)
   */
  async totalTrackCount(): Promise<number> {
    await this.ready_;
    return new Promise((resolve, reject) => {
      // run commands in series
      this.db_.serialize(() => {
        this.db_.get('SELECT COUNT(1) FROM tracks;', (error, row) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(row['COUNT(1)']);
        });
      });
    });
  }

  /**
   * initialize_database_() - accesses database and creates tables that we need
   * @param database_path - path to the .db file
   */
  private initializeDatabase_(database_path: string): void {
    this.ready_ = new Promise((resolve, reject) => {
      const profile = this.log_.profile('Initialize Database');
      const existed = fs.existsSync(database_path);

      // load database from file, fatal error if this fails
      this.db_ = new sqlite3.Database(database_path, (error) => {
        if (error) {
          this.log_.fatal(
            `Failed to open database at: ${database_path}`,
            error
          );
          profile.stop();
          reject(error);
          return;
        }
      });

      // if database exists, just open it, don't initalize
      if (existed) {
        this.log_.debug(
          `Database at ${database_path} exists, skipping initialization`
        );
        resolve();
        return;
      }

      this.log_.debug(
        `Database at ${database_path} did not exist, initializating`
      );
      // create the tables needed
      const tables = [
        {
          name: 'tracks',
          cols: '(remix_id STRING NOT NULL, track_id STRING NOT NULL)',
        },
        {
          name: 'remixes',
          cols: '(remix_id STRING NOT NULL, name STRING NOT NULL)',
        },
      ];

      let count = 0;
      for (let i = 0; i < tables.length; i++) {
        this.db_.run(
          `CREATE TABLE ${tables[i].name} ${tables[i].cols}`,
          (error) => {
            if (error) {
              this.log_.fatal(`Creating table: ${tables[i].name}.`, error);
            }

            // count how many commands have been completed, done initializing once all have been run
            count++;
            if (count === tables.length) {
              profile.stop({
                level_thresholds: { info: 0, warn: 1000, error: 5000 },
              });
              resolve();
            }
          }
        );
      }
    });
  }

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
  private isEmpty(str: string): boolean {
    return (
      str === null ||
      str === undefined ||
      str.match(/^\s*$/) !== null ||
      str === ''
    );
  }
}
