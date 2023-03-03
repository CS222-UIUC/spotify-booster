import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
  path: path.join(__dirname, '..', '..', '.env'),
});

import StartWebServer from './webserver/webserver';

StartWebServer();
