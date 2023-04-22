import { assert } from 'chai';
import request from 'supertest';
import path from 'path';
import express from 'express';
import sinon from 'sinon';

import createMashupRouter from '../../src/mashup_api/mashup_api';
import { createDirectory, removeDirectory } from '../test_utils/hooks/create_test_directory.test';
import stubConfig from '../test_utils/stubs/stub_config.test';
import { createLoggerStub, stubLogger } from '../test_utils/stubs/stub_logger.test';
import uniqueID from '../test_utils/unique_id.test';
import { stubSpotifyAuth } from '../test_utils/stubs/stub_spotify_auth.test';
import { createEmptyMashup } from './mashup_api_utils.test';
import * as GenerateMashup from '../../src/generate_mashup/generate_mashup';

const TEST_DIRECTORY = path.join(__dirname, 'test_mashup_api_mashups');

describe('Mashup API Authentication', () => {
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
    stubSpotifyAuth('valid_user_id');
    sinon.stub(GenerateMashup, 'default').callsFake(sinon.spy());

    const { db, mashup_api } = await createMashupRouter(createLoggerStub());

    this.app = express();
    this.app.use(mashup_api);
    this.db = db;

    this.mashup_id = await createEmptyMashup(this.app);

    this.test_requests = [
      { method: 'get', path: `/mashupapi/getMashupName?mashup_id=${this.mashup_id}` },
      {
        method: 'post',
        path: `/mashupapi/generateMashup?mashup_id=${this.mashup_id}&start_track_id=start_track_id&source_id=source_id&source_type=0`,
      },
      { method: 'put', path: `/mashupapi/setMashupName?mashup_id=${this.mashup_id}&name=new_name` },
      { method: 'get', path: `/mashupapi/getMashupTracks?mashup_id=${this.mashup_id}` },
      { method: 'put', path: `/mashupapi/addTrack?mashup_id=${this.mashup_id}&track_id=track_id&index=0` },
      { method: 'put', path: `/mashupapi/setStartMs?mashup_id=${this.mashup_id}&track_id=track_id&start_ms=1` },
      { method: 'put', path: `/mashupapi/setEndMs?mashup_id=${this.mashup_id}&track_id=track_id&end_ms=1` },
      { method: 'delete', path: `/mashupapi/removeTrack?mashup_id=${this.mashup_id}&track_id=track_id` },
      { method: 'delete', path: `/mashupapi/deleteMashup?mashup_id=${this.mashup_id}` },
    ];
  });

  afterEach(async function () {
    await this.db.close();
  });

  after(() => {
    removeDirectory(TEST_DIRECTORY);
  });

  it('does not reject valid spotify token', async function () {
    for (const req of this.test_requests as Array<{ method: 'get' | 'post' | 'put' | 'delete'; path: string }>) {
      const agent = request.agent(this.app)[req.method](req.path).set('Cookie', 'spotify_access_token=valid_token');
      const response = await agent.send();

      assert.equal(response.statusCode, 200, `Request to ${req.path} responds with success code`);
    }
  });

  it('rejects invalid spotify token', async function () {
    for (const req of this.test_requests as Array<{ method: 'get' | 'post' | 'put' | 'delete'; path: string }>) {
      const agent = request.agent(this.app)[req.method](req.path).set('Cookie', 'spotify_access_token=invalid_token');
      const response = await agent.send();

      assert.equal(response.statusCode, 403, `Request to ${req.path} responds with forbidden success code`);
    }
  });
});
