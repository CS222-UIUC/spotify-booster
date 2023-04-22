import { assert } from 'chai';
import request from 'supertest';
import path from 'path';
import express from 'express';
import sinon from 'sinon';

import createMashupRouter from '../../src/mashup_api/mashup_api';
import { arraysMatchUnordered } from '../test_utils/assertions/arrays_match.test';
import { matchTracks } from '../database_interface/database_interface_utils.test';
import { createDirectory, removeDirectory } from '../test_utils/hooks/create_test_directory.test';
import stubConfig from '../test_utils/stubs/stub_config.test';
import { stubLogger, createLoggerStub } from '../test_utils/stubs/stub_logger.test';
import { stubSpotifyAuth } from '../test_utils/stubs/stub_spotify_auth.test';
import uniqueID from '../test_utils/unique_id.test';
import { createEmptyMashup, insertTracks } from './mashup_api_utils.test';

const TEST_DIRECTORY = path.join(__dirname, 'test_mashup_api_mashups');

describe('Mashup API Tracks', () => {
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

    this.mashup_id = await createEmptyMashup(this.app);

    this.default_tracks = [
      { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
      { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 0, end_ms: -1 },
      { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 0, end_ms: -1 },
    ];
  });

  afterEach(async function () {
    await this.db.close();
  });

  after(() => {
    removeDirectory(TEST_DIRECTORY);
  });

  describe('Mashup API Add Track', () => {
    it('adds track with valid mashup_id', async function () {
      for (let i = 0; i < this.default_tracks.length; i++) {
        const response1 = await request(this.app).put(
          `/mashupapi/addTrack?mashup_id=${this.mashup_id}&track_id=${this.default_tracks[i].track_id}&index=0`
        );
        assert.equal(response1.statusCode, 200, 'Responds with success status code');
      }

      const response2 = await request(this.app).get(`/mashupapi/getMashupTracks?mashup_id=${this.mashup_id}`);

      assert.equal(response2.statusCode, 200, 'Responds with success status code');
      arraysMatchUnordered(response2.body.tracks, this.default_tracks, 'Mashup Tracks', matchTracks);
    });

    it('refuses to add track with invalid mashup_id', async function () {
      const mashup_id = 'invalid';
      const track_id = '6wmcrRId5aeo7hiEqHAtEO';
      const response1 = await request(this.app).put(
        `/mashupapi/addTrack?mashup_id=${mashup_id}&track_id=${track_id}&index=0`
      );

      assert.equal(response1.statusCode, 400, 'Responds with bad request code');
      assert.equal(response1.body.error_message, 'Invalid Mashup Id', 'Responds with error message');
    });

    it('refuses to add track with invalid track_id', async function () {
      const track_id = '';
      const response = await request(this.app).put(
        `/mashupapi/addTrack?mashup_id=${this.mashup_id}&track_id=${track_id}&index=0`
      );

      assert.equal(response.statusCode, 400, 'Responds with bad request code');
      assert.equal(response.body.error_message, 'Invalid Track Id', 'Responds with error message');
    });
  });

  describe('Mashup API Delete Track', () => {
    beforeEach(async function () {
      await insertTracks(this.app, this.mashup_id, this.default_tracks);
    });

    it('deletes track with valid mashup_id', async function () {
      const updated_tracks = [
        { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 0, end_ms: -1 },
        { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 0, end_ms: -1 },
      ];

      const response0 = await request(this.app).delete(
        `/mashupapi/removeTrack?mashup_id=${this.mashup_id}&track_id=${this.default_tracks[0].track_id}`
      );

      assert.equal(response0.statusCode, 200, 'Responds with success status code');

      const response1 = await request(this.app).get(`/mashupapi/getMashupTracks?mashup_id=${this.mashup_id}`);
      arraysMatchUnordered(response1.body.tracks, updated_tracks, 'Mashup Tracks', matchTracks);
    });

    it('refuses to add track with invalid mashup_id', async function () {
      const invalid_mashup_id = 'invalid';
      const response0 = await request(this.app).delete(
        `/mashupapi/removeTrack?mashup_id=${invalid_mashup_id}&track_id=${this.default_tracks[0].track_id}`
      );

      assert.equal(response0.statusCode, 400, 'Responds with bad request code');
      assert.equal(response0.body.error_message, 'Invalid Mashup Id', 'Responds with error message');

      const response1 = await request(this.app).get(`/mashupapi/getMashupTracks?mashup_id=${this.mashup_id}`);
      arraysMatchUnordered(response1.body.tracks, this.default_tracks, 'Mashup Tracks', matchTracks);
    });

    it('refuses to delete track not in mashup', async function () {
      const invalid_track_id = 'invalid';
      const response0 = await request(this.app).delete(
        `/mashupapi/removeTrack?mashup_id=${this.mashup_id}&track_id=${invalid_track_id}`
      );

      assert.equal(response0.statusCode, 400, 'Responds with bad request code');
      assert.equal(response0.body.error_message, 'Track Does Not Exist In Mashup', 'Responds with error message');

      const response1 = await request(this.app).get(`/mashupapi/getMashupTracks?mashup_id=${this.mashup_id}`);
      arraysMatchUnordered(response1.body.tracks, this.default_tracks, 'Mashup Tracks', matchTracks);
    });
  });

  describe('Mashup API Get Tracks', () => {
    beforeEach(async function () {
      await insertTracks(this.app, this.mashup_id, this.default_tracks);
    });

    it('refuses to get tracks with invalid mashup_id', async function () {
      const invalid_mashup_id = 'invalid';

      const response = await request(this.app).get(`/mashupapi/getMashupTracks?mashup_id=${invalid_mashup_id}`);
      assert.equal(response.statusCode, 400, 'Responds with bad request code');
      assert.equal(response.body.error_message, 'Invalid Mashup Id', 'Responds with error message');
    });
  });

  describe('Mashup API Set Start/End Data', () => {
    beforeEach(async function () {
      await insertTracks(this.app, this.mashup_id, this.default_tracks);
    });

    it('sets start and end data correctly', async function () {
      const updated_tracks = [
        { track_id: '6wmcrRId5aeo7hiEqHAtEO', start_ms: 0, end_ms: -1 },
        { track_id: '5OtpvLAq1uUQ6YmgxbI98H', start_ms: 10, end_ms: 0 },
        { track_id: '3mjqoMavGRKBfLiiKuV267', start_ms: 20, end_ms: 20 },
      ];
      for (let i = 0; i < updated_tracks.length; i++) {
        const response0 = await request(this.app).put(
          `/mashupapi/setStartMs?mashup_id=${this.mashup_id}&track_id=${updated_tracks[i].track_id}&start_ms=${updated_tracks[i].start_ms}`
        );
        const response1 = await request(this.app).put(
          `/mashupapi/setEndMs?mashup_id=${this.mashup_id}&track_id=${updated_tracks[i].track_id}&end_ms=${updated_tracks[i].end_ms}`
        );

        assert.equal(response0.statusCode, 200, 'Responds with success request code');
        assert.equal(response1.statusCode, 200, 'Responds with success request code');
      }

      const response2 = await request(this.app).get(`/mashupapi/getMashupTracks?mashup_id=${this.mashup_id}`);
      arraysMatchUnordered(response2.body.tracks, updated_tracks, 'Mashup Tracks', matchTracks);
    });

    it('refuses to set invalid start data', async function () {
      const invalid_mashup_id = 'invalid';
      const invalid_track_id = 'invalid;';
      const track_id = this.default_tracks[0].track_id;
      const response0 = await request(this.app).put(
        `/mashupapi/setStartMs?mashup_id=${this.mashup_id}&track_id=${track_id}&start_ms=${-1}`
      );
      const response1 = await request(this.app).put(
        `/mashupapi/setStartMs?mashup_id=${this.mashup_id}&track_id=${invalid_track_id}&start_ms=${0}`
      );
      const response2 = await request(this.app).put(
        `/mashupapi/setStartMs?mashup_id=${invalid_mashup_id}&track_id=${track_id}&start_ms=${0}`
      );
      const response3 = await request(this.app).put(
        `/mashupapi/setStartMs?mashup_id=${invalid_mashup_id}&track_id=${track_id}&start_ms=asdf`
      );

      assert.equal(response0.statusCode, 400, 'Responds with bad request code');
      assert.equal(response0.body.error_message, 'start_ms cannot be negative', 'Responds with error message');
      assert.equal(response1.statusCode, 400, 'Responds with bad request code');
      assert.equal(response1.body.error_message, 'Track Does Not Exist In Mashup', 'Responds with error message');
      assert.equal(response2.statusCode, 400, 'Responds with bad request code');
      assert.equal(response2.body.error_message, 'Invalid Mashup Id', 'Responds with error message');
      assert.equal(response3.statusCode, 400, 'Responds with bad request code');
    });

    it('refuses to set invalid end data', async function () {
      const invalid_mashup_id = 'invalid';
      const invalid_track_id = 'invalid';
      const track_id = this.default_tracks[0].track_id;
      const response0 = await request(this.app).put(
        `/mashupapi/setEndMs?mashup_id=${this.mashup_id}&track_id=${track_id}&end_ms=${-2}`
      );
      const response1 = await request(this.app).put(
        `/mashupapi/setEndMs?mashup_id=${this.mashup_id}&track_id=${invalid_track_id}&end_ms=${-1}`
      );
      const response2 = await request(this.app).put(
        `/mashupapi/setEndMs?mashup_id=${invalid_mashup_id}&track_id=${track_id}&end_ms=${-1}`
      );
      const response3 = await request(this.app).put(
        `/mashupapi/setEndMs?mashup_id=${invalid_mashup_id}&track_id=${track_id}&end_ms=asdf`
      );

      assert.equal(response0.statusCode, 400, 'Responds with bad request code');
      assert.equal(response0.body.error_message, 'end_ms cannot be less than -1', 'Responds with error message');
      assert.equal(response1.statusCode, 400, 'Responds with bad request code');
      assert.equal(response1.body.error_message, 'Track Does Not Exist In Mashup', 'Responds with error message');
      assert.equal(response2.statusCode, 400, 'Responds with bad request code');
      assert.equal(response2.body.error_message, 'Invalid Mashup Id', 'Responds with error message');
      assert.equal(response3.statusCode, 400, 'Responds with bad request code');
    });
  });
});
