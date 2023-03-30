import { assert } from 'chai';
import request from 'supertest';
import path from 'path';
import sinon from 'sinon';
import express from 'express';

import * as createRemixRouter from '../../src/remix_api/remix_api';
import * as cors from '../../src/webserver/cors_import';

import StartWebServer from '../../src/webserver/webserver';
import { createDirectory, removeDirectory } from '../test_utils/hooks/create_test_directory.test';
import { stubLogger } from '../test_utils/stubs/stub_logger.test';
import stubConfig from '../test_utils/stubs/stub_config.test';
import {
  createIndexFile,
  createStaticFiles,
  test_index_file,
  test_static_file0,
  test_static_file1,
} from './webserver_utils.test';
import uniqueID from '../test_utils/unique_id.test';

const TEST_DIRECTORY = path.join(__dirname, 'test_web_server');
const WEB_INDEX_PATH = path.join(TEST_DIRECTORY, 'index.html');
const WEB_STATIC_PATH = path.join(TEST_DIRECTORY, 'static');

const WEB_PORT = 8888;
const TEST_URL = 'http://localhost:8888';

describe('Web Server', () => {
  before(() => {
    createDirectory(TEST_DIRECTORY);
    createIndexFile(WEB_INDEX_PATH);
    createStaticFiles(WEB_STATIC_PATH);
  });

  beforeEach(function () {
    this.logger_stub = stubLogger();
    stubConfig({
      web_server_config: {
        port: WEB_PORT,
        static_path: WEB_STATIC_PATH,
        index_path: WEB_INDEX_PATH,
      },
      database_config: {
        path: path.join(TEST_DIRECTORY, uniqueID()),
      },
    });
  });

  after(() => {
    removeDirectory(TEST_DIRECTORY);
  });

  describe('Basic Web Server', () => {
    beforeEach(async function () {
      this.server = await StartWebServer();
    });

    afterEach(function (done) {
      this.server.close(() => done());
    });

    it('returns index page at /', async () => {
      const req = request(TEST_URL);
      const response = await req.get('/');

      assert.equal(response.text, test_index_file, 'Responds with correct index file');
    });

    it('returns index page at /callback', async () => {
      const req = request(TEST_URL);
      const response = await req.get('/callback');

      assert.equal(response.text, test_index_file, 'Responds with correct index file');
    });

    it('returns static content at /test_static0.js', async () => {
      const req = request(TEST_URL);
      const response = await req.get('/test_static0.js');

      assert.equal(response.text, test_static_file0, 'Responds with correct static file');
    });

    it('returns static content in a subfolder at /subfolder/test_static1.js', async () => {
      const req = request(TEST_URL);
      const response = await req.get('/subfolder/test_static1.js');

      assert.equal(response.text, test_static_file1, 'Responds with correct static file');
    });
  });

  describe('Web Logger', () => {
    it('logs error when express encounters an error', async function () {
      sinon.stub(createRemixRouter, 'default').callsFake(async () => {
        const remix_api = express.Router();
        remix_api.get('/error', () => {
          throw new Error('Some Error');
        });
        return { remix_api, db: undefined };
      });

      const server = await StartWebServer();

      const req = request(TEST_URL);
      await req.get('/error');

      assert.equal(this.logger_stub.error.callCount, 1, 'Calls error logger once');
      assert.throws(() => {
        throw this.logger_stub.error.getCall(0).args[1];
      }, 'Some Error');

      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    });
  });

  describe('Allow/Reject CORS', () => {
    it('calls CORS middleware when in dev environment', async () => {
      const spy = sinon.spy(cors, 'CORS');

      stubConfig({
        env_config: {
          in_dev_env: true,
        },
      });
      const server = await StartWebServer();

      const req = request(TEST_URL);
      await req.get('/index');

      assert.equal(spy.callCount, 1, 'Calls CORS Middleware');

      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    });

    it('does not call CORS middleware when in non dev environment', async () => {
      const spy = sinon.spy(cors, 'CORS');

      stubConfig({
        env_config: {
          in_dev_env: false,
        },
      });
      const server = await StartWebServer();

      const req = request(TEST_URL);
      await req.get('/index');

      assert.equal(spy.callCount, 0, 'Does not call CORS Middleware');

      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    });
  });
});
