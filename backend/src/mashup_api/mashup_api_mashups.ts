import express from 'express';

import DatabaseInterface from '../database_interface/database_interface';
import Logger from '../logger/logger';
import { AuthRequest } from '../spotify_authentication/spotify_authentication';
import { runAuthMashupAPIFunction, runMashupAPIFunction } from './mashup_api_util';
import GenerateMashup from '../generate_mashup/generate_mashup';

/**
 * createMashupsRouter() - Returns router for mashup part of mashup api
 * Handles adding/editing/deleting mashups
 * @param log - logger
 * @param db - database interface for mashups and tracks
 * @returns - Express router
 */
export default function createMashupsRouter(log: Logger, db: DatabaseInterface) {
  const router = express.Router();

  // Checks if a user is authorized to view/edit mashup
  const auth_function = async (req: AuthRequest) => {
    const mashup_id = req.query.mashup_id as string;
    return await db.mashupPermission(mashup_id, req.spotify_uid);
  };

  router.get(
    '/mashupapi/getUserMashups',
    runMashupAPIFunction(async (req: AuthRequest) => {
      const mashups = await db.getUserMashups(req.spotify_uid);
      return { code: 200, res: { mashups } };
    })
  );

  router.get(
    '/mashupapi/searchUserMashups',
    runMashupAPIFunction(async (req: AuthRequest) => {
      const search_string = req.query.search_string as string;
      let limit = 20;
      if (req.query.limit) {
        limit = parseInt(req.query.limit as string);
      }
      const results = await db.searchUserMashups(req.spotify_uid, search_string, limit);
      return { code: 200, res: { results } };
    })
  );

  router.get(
    '/mashupapi/getMashupName',
    runAuthMashupAPIFunction(async (req: AuthRequest) => {
      const mashup_id = req.query.mashup_id as string;

      const name = await db.getMashupName(mashup_id);
      return { code: 200, res: { name } };
    }, auth_function)
  );

  router.put(
    '/mashupapi/setMashupName',
    runAuthMashupAPIFunction(async (req: AuthRequest) => {
      const mashup_id = req.query.mashup_id as string;
      const name = req.query.name as string;

      await db.setMashupName(mashup_id, name);
      return { code: 200, res: {} };
    }, auth_function)
  );

  router.post(
    '/mashupapi/createMashup',
    runMashupAPIFunction(async (req: AuthRequest) => {
      const name = req.query.name as string;

      const mashup_id = await db.createMashup(name, req.spotify_uid);
      return { code: 200, res: { mashup_id } };
    })
  );

  router.post(
    '/mashupapi/generateMashup',
    runAuthMashupAPIFunction(async (req: AuthRequest) => {
      const mashup_id = req.query.mashup_id as string;
      const start_track_id = req.query.start_track_id as string;
      const source_id = req.query.source_id as string;
      const source_type = parseInt(req.query.source_type as string);

      await GenerateMashup(mashup_id, start_track_id, source_id, source_type, req.spotify_uid, db, log);

      return { code: 200, res: {} };
    }, auth_function)
  );

  router.delete(
    '/mashupapi/deleteMashup',
    runAuthMashupAPIFunction(async (req: AuthRequest) => {
      const mashup_id = req.query.mashup_id as string;

      await db.deleteMashup(mashup_id);
      return { code: 200, res: {} };
    }, auth_function)
  );

  return router;
}
