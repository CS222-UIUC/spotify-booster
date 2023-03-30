import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';

import Logger from '../logger/logger';
import createWebLogger from './web_logger';
import createRemixRouter from '../remix_api/remix_api';

/**
 * createHTTPSever() - Creates a http/https webserver using the environment configuration
 * @param log - logger
 * @param port - port to listen on
 * @returns - webserver
 */
function createHTTPServer(log: Logger, port: number) {
  const http_server = http.createServer();

  http_server.listen(port);
  http_server.on('listening', () => {
    log.info(`Webserver listening on port: ${port}`);
  });
  return http_server;
}

/**
 * createExpressApp() - Creates an express web app and loads routers and extensions
 * @param webserver - http/https webserver express should listen on
 * @param log - logger
 * @param db_location - location of remix database
 * @param static_path - location of static web files
 * @param index_path - location of index.html file
 * @returns express webserver
 */
function createExpressApp(
  webserver: http.Server,
  log: Logger,
  db_location: string,
  static_path: string,
  index_path: string,
  allow_cors: boolean
) {
  const remix_api = createRemixRouter(log, db_location);
  const { webLogError, webLogger } = createWebLogger(log);

  const app = express();
  if (allow_cors) {
    log.info('Enabling Cross-Origin Resource Sharing (CORS)');
    app.use(cors());
  }

  app.use(express.static(static_path)); // setup static directory for webapp
  app.use(webLogger);
  app.use(remix_api);

  // serve homepage
  app.get('/index', (res, req) => {
    req.sendFile(path.resolve(index_path));
  });

  app.use(webLogError); // must go at the end to make sure errors are handled

  webserver.on('request', app);

  return webserver;
}

/**
 * StartWebServer() - Starts the webserver
 * @param db_location - location of remix database
 * @param static_path - location of static web files
 * @param index_path - location of index.html file
 * @param port - port to listen on
 * @returns express webserver
 */
export default function StartWebServer(
  db_location: string,
  static_path: string,
  index_path: string,
  port: number,
  allow_cors: boolean
) {
  const logger = new Logger('Webserver');
  const webserver = createHTTPServer(logger, port);
  return createExpressApp(
    webserver,
    logger,
    db_location,
    static_path,
    index_path,
    allow_cors
  );
}
