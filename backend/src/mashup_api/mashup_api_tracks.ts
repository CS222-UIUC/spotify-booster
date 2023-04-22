import express from 'express';

import DatabaseInterface from '../database_interface/database_interface';
import Logger from '../logger/logger';
import { runAuthMashupAPIFunction } from './mashup_api_util';
import { AuthRequest } from '../spotify_authentication/spotify_authentication';

/**
 * createTracksRouter() - Returns router for tracks part of mashup api
 * Handles adding/removing/fetching tracks
 * @param log - logger
 * @param db - database interface for mashups and tracks
 * @returns - Express router
 */
export default function createTracksRouter(log: Logger, db: DatabaseInterface) {
  const router = express.Router();

  // Checks if a user is authorized to view/edit mashup
  const auth_function = async (req: AuthRequest) => {
    const mashup_id = req.query.mashup_id as string;
    return await db.mashupPermission(mashup_id, req.spotify_uid);
  };

  router.get(
    '/mashupapi/getMashupTracks',
    runAuthMashupAPIFunction(async (req) => {
      const mashup_id = req.query.mashup_id as string;
      const tracks = await db.getMashupTracks(mashup_id);

      return { code: 200, res: { tracks } };
    }, auth_function)
  );

  router.put(
    '/mashupapi/addTrack',
    runAuthMashupAPIFunction(async (req) => {
      const mashup_id = req.query.mashup_id as string;
      const track_id = req.query.track_id as string;
      const index = parseInt(req.query.index as string);

      await db.addTrack(mashup_id, track_id, index);
      return { code: 200, res: {} };
    }, auth_function)
  );

  router.put(
    '/mashupapi/setStartMs',
    runAuthMashupAPIFunction(async (req) => {
      const mashup_id = req.query.mashup_id as string;
      const track_id = req.query.track_id as string;
      const start_ms = parseInt(req.query.start_ms as string);

      await db.setStartMS(mashup_id, track_id, start_ms);

      return { code: 200, res: {} };
    }, auth_function)
  );

  router.put(
    '/mashupapi/setEndMs',
    runAuthMashupAPIFunction(async (req) => {
      const mashup_id = req.query.mashup_id as string;
      const track_id = req.query.track_id as string;
      const end_ms = parseInt(req.query.end_ms as string);

      await db.setEndMS(mashup_id, track_id, end_ms);
      return { code: 200, res: {} };
    }, auth_function)
  );

  router.delete(
    '/mashupapi/removeTrack',
    runAuthMashupAPIFunction(async (req) => {
      const mashup_id = req.query.mashup_id as string;
      const track_id = req.query.track_id as string;

      await db.removeTrack(mashup_id, track_id);
      return { code: 200, res: {} };
    }, auth_function)
  );

  return router;
}
