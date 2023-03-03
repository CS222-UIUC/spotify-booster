import express from 'express';

import DatabaseInterface from '../database_interface/database_interface';
import Logger from '../logger/logger';

export default function createRemixesRouter(
  log: Logger,
  db: DatabaseInterface
) {
  const router = express.Router();

  router.get('/remixapi/getRemixName', (req, res) => {
    //
  });

  router.get('/remixapi/getRemixTracks', (req, res) => {
    //
  });

  router.post('/remixapi/createRemix', (req, res) => {
    //
  });

  router.post('/remixapi/deleteRemix', (req, res) => {
    //
  });

  return router;
}
