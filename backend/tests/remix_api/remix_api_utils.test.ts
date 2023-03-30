import express from 'express';
import request from 'supertest';
import { TrackInfo } from '../../src/database_interface/track_db_interface';

/**
 * createEmptyRemix() - creates an empty remix through the api
 * @param app - express app with remix_api router attached
 * @returns - remix_id of empty remix that was created
 */
export async function createEmptyRemix(app: express.Application) {
  const remix_name = 'test_remix';
  const req0 = request(app);
  const response = await req0.post(`/remixapi/createRemix?name=${remix_name}`);
  return response.body.remix_id;
}

/**
 * insertTracks() - inserts tracks into remix through the api
 * @param app - express app with remix_api router attached
 * @param remix_id - remix_id of remix to insert tracks into
 * @param tracks - list of tracks to insert
 */
export async function insertTracks(app: express.Application, remix_id: string, tracks: TrackInfo[]) {
  for (let i = 0; i < tracks.length; i++) {
    await request(app).put(`/remixapi/addTrack?remix_id=${remix_id}&track_id=${tracks[i].track_id}`);
  }
}
