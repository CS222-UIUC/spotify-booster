import express from 'express';
import cookieParser from 'cookie-parser';

import { database_config } from '../config/config';
import DatabaseInterface from '../database_interface/database_interface';
import Logger from '../logger/logger';
import createSpotifyAuthenticator from '../spotify_authentication/spotify_authentication';
import createRemixesRouter from './remix_api_remixes';
import createTracksRouter from './remix_api_tracks';

export default async function createRemixRouter(log: Logger): Promise<{ db: DatabaseInterface; remix_api: express.Router }> {
  const db = new DatabaseInterface(database_config.path);
  await db.ready;

  const remix_api = express.Router();

  remix_api.use(cookieParser());
  remix_api.use('/remixapi/', createSpotifyAuthenticator(log));
  remix_api.use(createRemixesRouter(log, db));
  remix_api.use(createTracksRouter(log, db));

  return { db, remix_api };
}
