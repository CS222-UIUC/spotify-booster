import { assert } from 'chai';
import request from 'supertest';
import path from 'path';
import express from 'express';

import createRemixRouter from './remix_api';
import Logger from '../logger/logger';

const DB_LOCATION = path.join(__dirname, 'test.db');

/**
 * createRemix() - sends post request to create a remix and returns its id
 * @returns - remix_id and app
 */
async function createRemix() {
  const log = new Logger('Test');
  const router = createRemixRouter(log, DB_LOCATION);
  const app = express();
  app.use(router);
  const remix_name = 'text_remix';
  const req0 = request(app);
  const response = await req0.post(`/remixapi/createRemix?name=${remix_name}`);
  return { remix_id: response.body.remix_id, app };
}

describe('Remix API Create Remix', () => {
  it('creates remix with valid name', async () => {
    const log = new Logger('Test');
    const router = createRemixRouter(log, DB_LOCATION);
    const app = express();
    app.use(router);

    const remix_name = 'text_remix';
    const req0 = request(app);
    const response0 = await req0.post(
      `/remixapi/createRemix?name=${remix_name}`
    );

    assert(response0.statusCode === 200, 'Responds with success status code');
    assert(
      response0.body.remix_id !== '',
      'Does not respond with empty remix_id'
    );

    const req1 = request(app);
    const response1 = await req1.get(
      `/remixapi/getRemixName?remix_id=${response0.body.remix_id}`
    );

    assert(response1.statusCode === 200, 'Responds with success status code');
    assert(
      response1.body.name === remix_name,
      'Remix was created and accessable'
    );
  });

  it('refuses to create remix with invalid name', async () => {
    const log = new Logger('Test');
    const router = createRemixRouter(log, DB_LOCATION);
    const app = express();
    app.use(router);

    const req = request(app);
    const response = await req.post('/remixapi/createRemix');

    assert(response.statusCode === 400, 'Responds with bad request code');
    assert(
      response.body.error_message === 'Invalid Remix Name',
      'Responds with error message'
    );
  });
});

describe('Remix API Edit Remix Name', () => {
  it('edits remix with valid name', async () => {
    const { remix_id, app } = await createRemix();

    const new_name = 'new_remix_name';
    const response1 = await request(app).put(
      `/remixapi/setRemixName?remix_id=${remix_id}&name=${new_name}`
    );

    assert(response1.statusCode === 200, 'Responds with success status code');

    const req2 = request(app);
    const response2 = await req2.get(
      `/remixapi/getRemixName?remix_id=${remix_id}`
    );

    assert(response2.body.name === new_name, 'Remix was edited');
  });

  it('refuses to edit remix with invalid name', async () => {
    const { remix_id, app } = await createRemix();

    const new_name = '';
    const response = await request(app).put(
      `/remixapi/setRemixName?remix_id=${remix_id}&name=${new_name}`
    );

    assert(response.statusCode === 400, 'Responds with bad request code');
    assert(
      response.body.error_message === 'Invalid Remix Name',
      'Responds with error message'
    );
  });

  it('refuses to edit remix with invalid remix_id', async () => {
    const { app } = await createRemix();
    const remix_id = 'invalid';

    const new_name = 'valid_name';
    const response = await request(app).put(
      `/remixapi/setRemixName?remix_id=${remix_id}&name=${new_name}`
    );

    assert(response.statusCode === 400, 'Responds with bad request code');
    assert(
      response.body.error_message === 'Invalid Remix Id',
      'Responds with error message'
    );
  });
});

describe('Remix API Delete Remix', () => {
  it('deletes remix with valid id', async () => {
    const { remix_id, app } = await createRemix();

    const response1 = await request(app).delete(
      `/remixapi/deleteRemix?remix_id=${remix_id}`
    );

    assert(response1.statusCode === 200, 'Responds with success status code');

    const response2 = await request(app).get(
      `/remixapi/getRemixName?remix_id=${remix_id}`
    );

    assert(response2.statusCode === 400, 'Remix no longer exists');
    assert(
      response2.body.error_message === 'Invalid Remix Id',
      'Responds with error message'
    );
  });

  it('refuses to delete remix with invalid remix_id', async () => {
    const { remix_id, app } = await createRemix();

    const invalid_remix_id = 'invalid';
    const response1 = await request(app).delete(
      `/remixapi/deleteRemix?remix_id=${invalid_remix_id}`
    );

    assert(response1.statusCode === 400, 'Responds with bad request code');
    assert(
      response1.body.error_message === 'Invalid Remix Id',
      'Responds with error message'
    );

    const response2 = await request(app).get(
      `/remixapi/getRemixName?remix_id=${remix_id}`
    );

    assert(response2.statusCode === 200, 'Remix still exists');
  });
});
