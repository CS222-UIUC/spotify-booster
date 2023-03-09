import Logger from '../logger/logger';
import TrackDBInterface from './track_db_interface';

// tables the database needs
const TABLES = [
  {
    name: 'tracks',
    cols: '(remix_id STRING NOT NULL, track_id STRING NOT NULL)',
  },
  {
    name: 'remixes',
    cols: '(remix_id STRING NOT NULL, name STRING NOT NULL)',
  },
];

/**
 * DatabaseInterface() - SQLite Abstraction for saving user remixes
 * Contains methods for Creating/Deleting/Editing User Remixes the tracks they contain
 */
export default class DatabaseInterface extends TrackDBInterface {
  /**
   * @param database_path - path to the .db file
   */
  constructor(database_path: string) {
    super(database_path, TABLES, new Logger('Database'));
  }
}
