import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
  path: path.join(__dirname, '..', '..', '.env'),
});

const DATABASE_PATH = process.env.DATABASE_PATH;
const WEB_PORT = parseInt(process.env.WEB_PORT);
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const WEB_STATIC_PATH = process.env.WEB_STATIC_PATH;
const WEB_INDEX_PATH = process.env.WEB_INDEX_PATH;

import StartWebServer from './webserver/webserver';

StartWebServer(
  DATABASE_PATH,
  WEB_STATIC_PATH,
  WEB_INDEX_PATH,
  WEB_PORT,
  USE_HTTPS
);
