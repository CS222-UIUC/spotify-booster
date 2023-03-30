import { assert } from 'chai';
import request from 'supertest';
import path from 'path';
import express from 'express';

import createRemixRouter from '../../src/remix_api/remix_api';
import { createDirectory, removeDirectory } from '../test_utils/hooks/create_test_directory.test';
import stubConfig from '../test_utils/stubs/stub_config.test';
import { createLoggerStub, stubLogger } from '../test_utils/stubs/stub_logger.test';
import uniqueID from '../test_utils/unique_id.test';
import { stubSpotifyAuth } from '../test_utils/stubs/stub_spotify_auth.test';
import { createEmptyRemix } from './remix_api_utils.test';

const TEST_DIRECTORY = path.join(__dirname, 'test_remix_api_remixes');

describe('Remix API Remixes', () => {
  before(() => {
    createDirectory(TEST_DIRECTORY);
  });

  beforeEach(async function () {
    stubLogger();
    stubConfig({
      database_config: {
        path: path.join(TEST_DIRECTORY, uniqueID()),
      },
    });
    stubSpotifyAuth(true, 'some_user_id');

    const { db, remix_api } = await createRemixRouter(createLoggerStub());
    this.app = express();
    this.app.use(remix_api);
    this.db = db;
  });

  afterEach(async function () {
    await this.db.close();
  });

  after(() => {
    removeDirectory(TEST_DIRECTORY);
  });

  describe('Remix API Create Remix', () => {
    it('creates remix with valid name', async function () {
      const remix_name = 'test_remix';
      const req0 = request(this.app);
      const response0 = await req0.post(`/remixapi/createRemix?name=${remix_name}`);

      assert(response0.statusCode === 200, 'Responds with success status code');
      assert(response0.body.remix_id !== '', 'Does not respond with empty remix_id');

      const req1 = request(this.app);
      const response1 = await req1.get(`/remixapi/getRemixName?remix_id=${response0.body.remix_id}`);

      assert(response1.statusCode === 200, 'Responds with success status code');
      assert(response1.body.name === remix_name, 'Remix was created and accessable');
    });

    it('refuses to create remix with invalid name', async function () {
      const req = request(this.app);
      const response = await req.post('/remixapi/createRemix');

      assert(response.statusCode === 400, 'Responds with bad request code');
      assert(response.body.error_message === 'Invalid Remix Name', 'Responds with error message');
    });
  });

  describe('Remix API Edit Remix Name', () => {
    beforeEach(async function () {
      this.remix_id = await createEmptyRemix(this.app);
    });

    it('edits remix with valid name', async function () {
      const new_name = 'new_remix_name';
      const response1 = await request(this.app).put(`/remixapi/setRemixName?remix_id=${this.remix_id}&name=${new_name}`);

      assert(response1.statusCode === 200, 'Responds with success status code');

      const req2 = request(this.app);
      const response2 = await req2.get(`/remixapi/getRemixName?remix_id=${this.remix_id}`);

      assert(response2.body.name === new_name, 'Remix was edited');
    });

    it('refuses to edit remix with invalid name', async function () {
      const new_name = '';
      const response = await request(this.app).put(`/remixapi/setRemixName?remix_id=${this.remix_id}&name=${new_name}`);

      assert(response.statusCode === 400, 'Responds with bad request code');
      assert(response.body.error_message === 'Invalid Remix Name', 'Responds with error message');
    });

    it('refuses to edit remix with invalid remix_id', async function () {
      const remix_id = 'invalid';
      const new_name = 'valid_name';
      const response = await request(this.app).put(`/remixapi/setRemixName?remix_id=${remix_id}&name=${new_name}`);

      assert(response.statusCode === 400, 'Responds with bad request code');
      assert(response.body.error_message === 'Invalid Remix Id', 'Responds with error message');
    });
  });

  describe('Remix API Delete Remix', () => {
    beforeEach(async function () {
      this.remix_id = await createEmptyRemix(this.app);
    });

    it('deletes remix with valid id', async function () {
      const response1 = await request(this.app).delete(`/remixapi/deleteRemix?remix_id=${this.remix_id}`);

      assert(response1.statusCode === 200, 'Responds with success status code');

      const response2 = await request(this.app).get(`/remixapi/getRemixName?remix_id=${this.remix_id}`);

      assert(response2.statusCode === 400, 'Remix no longer exists');
      assert(response2.body.error_message === 'Invalid Remix Id', 'Responds with error message');
    });

    it('refuses to delete remix with invalid remix_id', async function () {
      const invalid_remix_id = 'invalid';
      const response1 = await request(this.app).delete(`/remixapi/deleteRemix?remix_id=${invalid_remix_id}`);

      assert(response1.statusCode === 400, 'Responds with bad request code');
      assert(response1.body.error_message === 'Invalid Remix Id', 'Responds with error message');

      const response2 = await request(this.app).get(`/remixapi/getRemixName?remix_id=${this.remix_id}`);

      assert(response2.statusCode === 200, 'Remix still exists');
    });
  });
});
