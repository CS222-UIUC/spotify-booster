import express from 'express';

import DatabaseInterface from '../database_interface/database_interface';
import Logger from '../logger/logger';

export default function createTracksRouter(log: Logger, db: DatabaseInterface) {
  const router = express.Router();

  router.get('/remixapi/getRemixTracks', (req, res) => {
    //
  });

  router.post('/remixapi/addTrack', (req, res) => {
    //
  });

  router.post('/remixapi/removeTrack', (req, res) => {
    //
  });

  return router;
}
