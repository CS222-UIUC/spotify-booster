import express from 'express';

import DatabaseInterface from '../database_interface/database_interface';
import Logger from '../logger/logger';

/**
 * createRemixesRouter() - Returns router for remix part of remix api
 * Handles adding/editing/deleting remixes
 * @param log - logger
 * @param db - database interface for remixes and tracks
 * @returns - Express router
 */
export default function createRemixesRouter(log: Logger, db: DatabaseInterface) {
  const router = express.Router();

  router.get('/remixapi/getRemixName', async (req, res) => {
    const remix_id = req.query.remix_id as string;

    try {
      const name = await db.getRemixName(remix_id);
      res.status(200).send({ name });
    } catch (error) {
      res.status(400).send({ error_message: error.message });
    }
  });

  router.put('/remixapi/setRemixName', async (req, res) => {
    const remix_id = req.query.remix_id as string;
    const name = req.query.name as string;

    try {
      await db.setRemixName(remix_id, name);
      res.status(200).send({});
    } catch (error) {
      res.status(400).send({ error_message: error.message });
    }
  });

  router.post('/remixapi/createRemix', async (req, res) => {
    const name = req.query.name as string;

    try {
      const remix_id = await db.createRemix(name);
      res.status(200).send({ remix_id });
    } catch (error) {
      res.status(400).send({ error_message: error.message });
    }
  });

  router.delete('/remixapi/deleteRemix', async (req, res) => {
    const remix_id = req.query.remix_id as string;

    try {
      await db.deleteRemix(remix_id);
      res.status(200).send({});
    } catch (error) {
      res.status(400).send({ error_message: error.message });
    }
  });

  return router;
}
