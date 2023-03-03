import express from 'express';

import DatabaseInterface from '../database_interface/database_interface';
import Logger from '../logger/logger';

import createRemixesRouter from './remix_api_remixes';
import createTracksRouter from './remix_api_tracks';

export default function createRemixRouter(
  log: Logger,
  db_location: string
): express.Router {
  const db = new DatabaseInterface(db_location);

  const router = express.Router();
  router.use(createRemixesRouter(log, db));
  router.use(createTracksRouter(log, db));

  return router;
}
