import express from 'express';

import DatabaseInterface from '../database_interface/database_interface';
import Logger from '../logger/logger';

import createRemixesRouter from './remix_api_remixes';

export default function createRemixRouter(
  log: Logger,
  db_location: string
): express.Router {
  const db = new DatabaseInterface(db_location);

  const router = express.Router();
  router.use(createRemixesRouter(log, db));

  return router;
}
