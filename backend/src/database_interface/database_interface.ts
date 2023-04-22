import Logger from '../logger/logger';
import TrackDBInterface from './track_db_interface';

// tables the database needs
const TABLES = [
  {
    name: 'tracks',
    cols: '("mashup_id" STRING NOT NULL, "track_id" STRING NOT NULL, "index" INT NOT NULL, "start_ms" INT NOT NULL, "end_ms" INT NOT NULL)',
  },
  {
    name: 'mashups',
    cols: '("mashup_id" STRING NOT NULL, "name" STRING NOT NULL, "user_id" STRING NOT NULL)',
  },
];

// indexes for the database
const INDEXES = [
  { name: 'track_mashup_id_index', table: 'tracks', column: 'mashup_id' },
  { name: 'track_track_id_index', table: 'tracks', column: 'track_id' },
  { name: 'mashup_mashup_id_index', table: 'mashups', column: 'mashup_id' },
  { name: 'mashup_name_index', table: 'mashups', column: 'name' },
  { name: 'mashup_user_id_index', table: 'mashups', column: 'user_id' },
];

/**
 * DatabaseInterface() - SQLite Abstraction for saving user mashups
 * Contains methods for Creating/Deleting/Editing User Mashups the tracks they contain
 */
export default class DatabaseInterface extends TrackDBInterface {
  /**
   * @param database_path - path to the .db file
   */
  constructor(database_path: string) {
    super(database_path, TABLES, INDEXES, new Logger('Database'));
  }
}
