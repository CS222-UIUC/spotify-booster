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

const WEB_PORT = parseInt(process.env.WEB_PORT) || 8080;
const PRIVATE_KEY_LOC = process.env.PRIVATE_KEY_LOC;
const CERTIFICATE_LOC = process.env.CERTIFICATE_LOC;
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const WEB_STATIC_PATH = process.env.WEB_STATIC_PATH;
const WEB_INDEX_PATH = process.env.WEB_INDEX_PATH;

/**
 * createHTTPSever() - Creates a http/https webserver using the environment configuration
 */
function createHTTPServer() {
  let http_server;
  if (USE_HTTPS) {
    // if using HTTPS, grab private key and certificate and create a https webserver
    const privateKey = fs.readFileSync(PRIVATE_KEY_LOC, 'utf8');
    const certificate = fs.readFileSync(CERTIFICATE_LOC, 'utf8');

    http_server = https.createServer({
      key: privateKey,
      cert: certificate,
    });
  } else {
    // otherwise just create a normal unsecured http webserver
    http_server = http.createServer();
  }

  http_server.listen(WEB_PORT);
  return http_server;
}

/**
 * createExpressApp() - Creates an express web app and loads routers and extensions
 * @param webserver - http/https webserver express should listen on
 */
function createExpressApp(webserver: http.Server | https.Server, log: Logger) {
  const remix_api = createRemixRouter(log);
  const spotify_auth = createSpotifyAuthenticationRouter(log);
  const { webLogError, webLogger } = createWebLogger(log);

  const app = express();
  app.use(express.static(WEB_STATIC_PATH)); // setup static directory for webapp
  app.use(webLogger);
  app.use(remix_api);
  app.use(spotify_auth);
  app.use(authenticationMiddleware);

  // serve homepage
  app.get('/index', (res, req) => {
    req.sendFile(path.resolve(WEB_INDEX_PATH));
  });

  app.use(webLogError); // must go at the end to make sure errors are handled

  webserver.on('request', app);

  webserver.on('listening', () => {
    log.info(`Webserver listening on port: ${WEB_PORT}`);
  });

  return webserver;
}

export default function StartWebServer() {
  const webserver = createHTTPServer();
  const logger = new Logger('Webserver');
  return createExpressApp(webserver, logger);
}
