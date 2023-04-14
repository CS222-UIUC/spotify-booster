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
import { arraysMatchUnordered } from '../test_utils/assertions/arrays_match.test';
import { matchUserMashup } from '../database_interface/database_interface_utils.test';
import * as GenerateMashup from '../../src/generate_mashup/generate_mashup';

const TEST_DIRECTORY = path.join(__dirname, 'test_mashup_api_mashups');

describe('Mashup API Mashups', () => {
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
    stubSpotifyAuth('some_user_id', true);

    const { db, mashup_api } = await createMashupRouter(createLoggerStub());

    sinon.stub(db, 'mashupPermission').returns(Promise.resolve(true));

    this.app = express();
    this.app.use(mashup_api);
    this.db = db;
  });

  afterEach(async function () {
    await this.db.close();
  });

  after(() => {
    removeDirectory(TEST_DIRECTORY);
  });

  describe('Mashup API Get User Mashups', () => {
    it('gets users mashups', async function () {
      await this.db.createMashup('other_users_mashup0', 'some_other_user');
      await this.db.createMashup('other_users_mashup1', 'some_other_user');
      const mashup_id0 = await this.db.createMashup('users_mashup0', 'some_user_id');
      const mashup_id1 = await this.db.createMashup('users_mashup1', 'some_user_id');

      const expected0 = [
        { mashup_id: mashup_id0, name: 'users_mashup0' },
        { mashup_id: mashup_id1, name: 'users_mashup1' },
      ];

      const req = request(this.app);
      const response = await req.get('/mashupapi/getUserMashups');
      assert.equal(response.statusCode, 200, 'Responds with success status code');
      arraysMatchUnordered(response.body.mashups, expected0, 'Users Mashups', matchUserMashup);
    });
  });

  describe('Mashup API Create Mashup', () => {
    it('creates mashup with valid name', async function () {
      const mashup_name = 'test_mashup';
      const req0 = request(this.app);
      const response0 = await req0.post(`/mashupapi/createMashup?name=${mashup_name}`);

      assert.equal(response0.statusCode, 200, 'Responds with success status code');
      assert.notEqual(response0.body.mashup_id, '', 'Does not respond with empty mashup_id');

      const req1 = request(this.app);
      const response1 = await req1.get(`/mashupapi/getMashupName?mashup_id=${response0.body.mashup_id}`);

      assert.equal(response1.statusCode, 200, 'Responds with success status code');
      assert.equal(response1.body.name, mashup_name, 'Mashup was created and accessable');
    });

    it('refuses to create mashup with invalid name', async function () {
      const req = request(this.app);
      const response = await req.post('/mashupapi/createMashup');

      assert.equal(response.statusCode, 400, 'Responds with bad request code');
      assert.equal(response.body.error_message, 'Invalid Mashup Name', 'Responds with error message');
    });
  });

  describe('Mashup API Generate Mashup', () => {
    it('calls generate mashup method', async function () {
      const spy = sinon.spy();
      sinon.stub(GenerateMashup, 'default').callsFake(spy);

      const mashup_id = 'mashup_id';
      const start_track_id = 'track_id';
      const source_id = 'source_id';
      const source_type = '0';

      const req = request.agent(this.app);
      const response = await req
        .post(
          `/mashupapi/generateMashup?mashup_id=${mashup_id}&start_track_id=${start_track_id}&source_id=${source_id}&source_type=${source_type}`
        )
        .set('Cookie', 'spotify_access_token=valid_token')
        .send();

      assert.equal(response.statusCode, 200, 'Responds with success status code');
      assert.equal(spy.callCount, 1, 'GenerateMashup called once');
      assert.equal(spy.getCall(0).args[0], mashup_id, 'GenerateMashup called with correct arg 0');
      assert.equal(spy.getCall(0).args[1], start_track_id, 'GenerateMashup called with correct arg 1');
      assert.equal(spy.getCall(0).args[2], source_id, 'GenerateMashup called with correct arg 2');
      assert.equal(spy.getCall(0).args[3], source_type, 'GenerateMashup called with correct arg 3');
      assert.equal(spy.getCall(0).args[4], 'valid_token', 'GenerateMashup called with correct arg 4');
    });

    it('returns error when source_type is not valid integer', async function () {
      const mashup_id = 'mashup_id';
      const start_track_id = 'track_id';
      const source_id = 'source_id';
      const source_type = 'asdf';

      const req = request.agent(this.app);
      const response = await req
        .post(
          `/mashupapi/generateMashup?mashup_id=${mashup_id}&start_track_id=${start_track_id}&source_id=${source_id}&source_type=${source_type}`
        )
        .set('Cookie', 'spotify_access_token=valid_token')
        .send();

      assert.equal(response.statusCode, 400, 'Responds with bad request code');
    });

    it('returns error when generateMashup function throws error', async function () {
      sinon.stub(GenerateMashup, 'default').rejects(new Error('Some Error'));

      const mashup_id = 'mashup_id';
      const start_track_id = 'track_id';
      const source_id = 'source_id';
      const source_type = '0';

      const req = request.agent(this.app);
      const response = await req
        .post(
          `/mashupapi/generateMashup?mashup_id=${mashup_id}&start_track_id=${start_track_id}&source_id=${source_id}&source_type=${source_type}`
        )
        .set('Cookie', 'spotify_access_token=valid_token')
        .send();

      assert.equal(response.statusCode, 400, 'Responds with bad request code');
      assert.equal(response.body.error_message, 'Some Error');
    });
  });

  describe('Mashup API Edit Mashup Name', () => {
    beforeEach(async function () {
      this.mashup_id = await createEmptyMashup(this.app);
    });

    it('edits mashup with valid name', async function () {
      const new_name = 'new_mashup_name';
      const response1 = await request(this.app).put(`/mashupapi/setMashupName?mashup_id=${this.mashup_id}&name=${new_name}`);

      assert.equal(response1.statusCode, 200, 'Responds with success status code');

      const req2 = request(this.app);
      const response2 = await req2.get(`/mashupapi/getMashupName?mashup_id=${this.mashup_id}`);

      assert.equal(response2.body.name, new_name, 'Mashup was edited');
    });

    it('refuses to edit mashup with invalid name', async function () {
      const new_name = '';
      const response = await request(this.app).put(`/mashupapi/setMashupName?mashup_id=${this.mashup_id}&name=${new_name}`);

      assert.equal(response.statusCode, 400, 'Responds with bad request code');
      assert.equal(response.body.error_message, 'Invalid Mashup Name', 'Responds with error message');
    });

    it('refuses to edit mashup with invalid mashup_id', async function () {
      const mashup_id = 'invalid';
      const new_name = 'valid_name';
      const response = await request(this.app).put(`/mashupapi/setMashupName?mashup_id=${mashup_id}&name=${new_name}`);

      assert.equal(response.statusCode, 400, 'Responds with bad request code');
      assert.equal(response.body.error_message, 'Invalid Mashup Id', 'Responds with error message');
    });
  });

  describe('Mashup API Delete Mashup', () => {
    beforeEach(async function () {
      this.mashup_id = await createEmptyMashup(this.app);
    });

    it('deletes mashup with valid id', async function () {
      const response1 = await request(this.app).delete(`/mashupapi/deleteMashup?mashup_id=${this.mashup_id}`);

      assert.equal(response1.statusCode, 200, 'Responds with success status code');

      const response2 = await request(this.app).get(`/mashupapi/getMashupName?mashup_id=${this.mashup_id}`);

      assert.equal(response2.statusCode, 400, 'Mashup no longer exists');
      assert.equal(response2.body.error_message, 'Invalid Mashup Id', 'Responds with error message');
    });

    it('refuses to delete mashup with invalid mashup_id', async function () {
      const invalid_mashup_id = 'invalid';
      const response1 = await request(this.app).delete(`/mashupapi/deleteMashup?mashup_id=${invalid_mashup_id}`);

      assert.equal(response1.statusCode, 400, 'Responds with bad request code');
      assert.equal(response1.body.error_message, 'Invalid Mashup Id', 'Responds with error message');

      const response2 = await request(this.app).get(`/mashupapi/getMashupName?mashup_id=${this.mashup_id}`);

      assert.equal(response2.statusCode, 200, 'Mashup still exists');
    });
  });

  describe('Mashup API Search Mashups', () => {
    it('Finds a users mashups', async function () {
      const mashup_names_to_search = [
        'a mashup 0',
        'a mashup 1',
        'a mashup 2',
        'another mashup 0',
        'another mashup 1',
        'another mashup 2',
        'another mashup 3',
      ];
      for (let i = 0; i < mashup_names_to_search.length; i++) {
        await this.db.createMashup(mashup_names_to_search[i], 'some_user_id');
      }

      const response0 = await request(this.app).get('/mashupapi/searchUserMashups?search_string=a');
      const matches_all = response0.body.results.map((m: { name: string }) => m.name);
      arraysMatchUnordered(matches_all, mashup_names_to_search, 'Search String: a');

      const response1 = await request(this.app).get('/mashupapi/searchUserMashups?search_string=A');
      const matches_all_caps = response1.body.results.map((m: { name: string }) => m.name);
      arraysMatchUnordered(matches_all_caps, mashup_names_to_search, 'Search String: A');

      const response2 = await request(this.app).get('/mashupapi/searchUserMashups?search_string=ano');
      const matches_some = response2.body.results.map((m: { name: string }) => m.name);
      arraysMatchUnordered(matches_some, mashup_names_to_search.slice(3, 7), 'Search String: ano');

      const response3 = await request(this.app).get('/mashupapi/searchUserMashups?search_string=ANo');
      const matches_some_mixed = response3.body.results.map((m: { name: string }) => m.name);
      arraysMatchUnordered(matches_some_mixed, mashup_names_to_search.slice(3, 7), 'Search String: ANo');

      const response4 = await request(this.app).get('/mashupapi/searchUserMashups?search_string=a&limit=3');
      assert.equal(response4.body.results.length, 3, 'Limits results to 3');
    });
  });
});
