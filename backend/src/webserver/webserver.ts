import express from 'express';
import http from 'http';
import path from 'path';

import { env_config, web_server_config } from '../config/config';
import Logger from '../logger/logger';
import createWebLogger from './web_logger';
import createRemixRouter from '../remix_api/remix_api';
import { CORS } from './cors_import';

/**
 * createHTTPSever() - Creates a http/https webserver using the environment configuration
 * @param log - logger
 * @returns - webserver
 */
function createHTTPServer(log: Logger) {
  const http_server = http.createServer();

  http_server.listen(web_server_config.port);
  http_server.on('listening', () => {
    log.info(`Webserver listening on port: ${web_server_config.port}`);
  });
  return http_server;
}

/**
 * createExpressApp() - Creates an express web app and loads routers and extensions
 * @param webserver - http/https webserver express should listen on
 * @param log - logger
 * @returns express webserver
 */
async function createExpressApp(webserver: http.Server, log: Logger) {
  const { db, remix_api } = await createRemixRouter(log);
  const { webLogError, webLogger } = createWebLogger(log);

  const app = express();
  if (env_config.in_dev_env) {
    log.info('Enabling Cross-Origin Resource Sharing (CORS)');
    app.use(CORS);
  }

  app.use(express.static(web_server_config.static_path)); // setup static directory for webapp
  app.use(webLogger);
  app.use(remix_api);

  // serve homepage
  app.get('/', (res, req) => {
    req.sendFile(path.resolve(web_server_config.index_path));
  });

  // send app on callback too
  app.get('/callback', (res, req) => {
    req.sendFile(path.resolve(web_server_config.index_path));
  });

  app.use(webLogError); // must go at the end to make sure errors are handled

  webserver.on('request', app);

  webserver.on('close', async () => {
    log.info('Closing webserver and database');
    await db.close();
  });
  return webserver;
}

/**
 * StartWebServer() - Starts the webserver
 * @returns express webserver
 */
export default function StartWebServer() {
  const logger = new Logger('Webserver');
  const webserver = createHTTPServer(logger);
  return createExpressApp(webserver, logger);
}
