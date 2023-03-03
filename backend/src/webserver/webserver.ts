import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

import Logger from '../logger/logger';
import createWebLogger from './web_logger';
import createRemixRouter from '../remix_api/remix_api';
import {
  createSpotifyAuthenticationRouter,
  authenticationMiddleware,
} from '../spotify_authentication/spotify_authentication';

/**
 * createHTTPSever() - Creates a http/https webserver using the environment configuration
 * @param log - logger
 * @param port - port to listen on
 * @param use_https - use https security or not
 * @param private_key_loc - location of private key (can be empty if not using https)
 * @param certificate_key_loc - location of certificte (can be empty if not using https)
 * @returns - webserver
 */
function createHTTPServer(
  log: Logger,
  port: number,
  use_https: boolean,
  private_key_loc?: string,
  certificate_key_loc?: string
) {
  let http_server;
  if (use_https) {
    // if using HTTPS, grab private key and certificate and create a https webserver
    const privateKey = fs.readFileSync(private_key_loc, 'utf8');
    const certificate = fs.readFileSync(certificate_key_loc, 'utf8');

    http_server = https.createServer({
      key: privateKey,
      cert: certificate,
    });
  } else {
    // otherwise just create a normal unsecured http webserver
    http_server = http.createServer();
  }

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
  webserver: http.Server | https.Server,
  log: Logger,
  db_location: string,
  static_path: string,
  index_path: string
) {
  const remix_api = createRemixRouter(log, db_location);
  const spotify_auth = createSpotifyAuthenticationRouter(log);
  const { webLogError, webLogger } = createWebLogger(log);

  const app = express();
  app.use(express.static(static_path)); // setup static directory for webapp
  app.use(webLogger);
  app.use(remix_api);
  app.use(spotify_auth);
  app.use(authenticationMiddleware);

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
 * @param use_https - use https security or not
 * @param private_key_loc - location of private key (can be empty if not using https)
 * @param certificate_key_loc - location of certificte (can be empty if not using https)
 * @returns express webserver
 */
export default function StartWebServer(
  db_location: string,
  static_path: string,
  index_path: string,
  port: number,
  use_https: boolean,
  private_key_loc?: string,
  certificate_key_loc?: string
) {
  const logger = new Logger('Webserver');
  const webserver = createHTTPServer(
    logger,
    port,
    use_https,
    private_key_loc,
    certificate_key_loc
  );
  return createExpressApp(
    webserver,
    logger,
    db_location,
    static_path,
    index_path
  );
}
