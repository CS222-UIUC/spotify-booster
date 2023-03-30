import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

// Pulls config from .env file and exports them in seperate objects
// Makes stubbing configs for testing easier

const IN_DEV_DEV = process.env.APP_ENV === 'Development';

export type EnvironmentConfig = {
  in_dev_env: boolean;
};
export const env_config = Object.freeze({
  in_dev_env: IN_DEV_DEV,
});

// Backend Logger Configuration
const LOG_FILE = process.env.LOG_FILE === 'true';
const LOG_CONSOLE = process.env.LOG_CONSOLE === 'true';
const LOG_FILE_DIRECTORY = process.env.LOG_FILE_DIRECTORY;
const LOG_FILE_NAME = process.env.LOG_FILE_NAME;
const LOG_DATE_PATTERN = process.env.LOG_DATE_PATTERN;
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE;
const LOG_MAX_FILES = process.env.LOG_MAX_FILES;
const ZIP_LOGS = process.env.ZIP_LOGS === 'true';

export type LoggerConfig = {
  log_file: boolean;
  log_console: boolean;
  file_directory: string;
  file_name: string;
  date_pattern: string;
  max_size: string;
  max_files: string;
  zip_logs: boolean;
};
export const logger_config: LoggerConfig = Object.freeze({
  log_file: LOG_FILE,
  log_console: LOG_CONSOLE,
  file_directory: LOG_FILE_DIRECTORY,
  file_name: LOG_FILE_NAME,
  date_pattern: LOG_DATE_PATTERN,
  max_size: LOG_MAX_SIZE,
  max_files: LOG_MAX_FILES,
  zip_logs: ZIP_LOGS,
});

// Web Server Configuration
const WEB_PORT = parseInt(process.env.WEB_PORT);
const WEB_STATIC_PATH = process.env.WEB_STATIC_PATH;
const WEB_INDEX_PATH = process.env.WEB_INDEX_PATH;

export type WebServerConfig = {
  port: number;
  static_path: string;
  index_path: string;
};
export const web_server_config: WebServerConfig = Object.freeze({
  port: WEB_PORT,
  static_path: WEB_STATIC_PATH,
  index_path: WEB_INDEX_PATH,
});

// Spotify API Keys
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URL = process.env.SPOTIFY_REDIRECT_URL;

export type SpotifyAPIConfig = {
  client_id: string;
  client_secret: string;
  redirect_url: string;
};
export const spotify_api_config: SpotifyAPIConfig = Object.freeze({
  client_id: SPOTIFY_CLIENT_ID,
  client_secret: SPOTIFY_CLIENT_SECRET,
  redirect_url: SPOTIFY_REDIRECT_URL,
});

// SQLITE Database Configuration
const DATABASE_PATH = process.env.DATABASE_PATH;

export type DatabaseConfig = {
  path: string;
};
export const database_config: DatabaseConfig = Object.freeze({
  path: DATABASE_PATH,
});
