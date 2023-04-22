import express from 'express';
import request from 'supertest';

import { TrackInfo } from '../../src/database_interface/track_db_interface';

/**
 * createEmptyMashup() - creates an empty mashup through the api
 * @param app - express app with mashup_api router attached
 * @returns - mashup_id of empty mashup that was created
 */
export async function createEmptyMashup(app: express.Application) {
  const mashup_name = 'test_mashup';
  const agent = request
    .agent(app)
    .post(`/mashupapi/createMashup?name=${mashup_name}`)
    .set('Cookie', 'spotify_access_token=valid_token');

  const response = await agent.send();
  return response.body.mashup_id;
}

/**
 * insertTracks() - inserts tracks into mashup through the api
 * @param app - express app with mashup_api router attached
 * @param mashup_id - mashup_id of mashup to insert tracks into
 * @param tracks - list of tracks to insert
 */
export async function insertTracks(app: express.Application, mashup_id: string, tracks: TrackInfo[]) {
  for (let i = 0; i < tracks.length; i++) {
    await request(app).put(`/mashupapi/addTrack?mashup_id=${mashup_id}&track_id=${tracks[i].track_id}&index=${i}`);
  }
}
