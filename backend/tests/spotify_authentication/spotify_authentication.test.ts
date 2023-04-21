import { assert } from 'chai';
import sinon from 'sinon';
import express from 'express';
import request from 'supertest';

import { Response } from 'express';
import createSpotifyAuthenticator, { AuthRequest } from '../../src/spotify_authentication/spotify_authentication';
import { createLoggerStub } from '../test_utils/stubs/stub_logger.test';
import { stubSpotifyAPI } from './spotify_authentication_utils.test';

describe('Spotify Authentication Middleware', () => {
  beforeEach(function () {
    stubSpotifyAPI();
    this.req = {
      headers: {},
      socket: {
        remoteAddress: 'test',
      },
    } as AuthRequest;

    this.spotifyAuthentication = createSpotifyAuthenticator(createLoggerStub());

    this.res_stub = {
      status: () => {
        return {
          send: () => {
            return;
          },
        };
      },
    };
  });

  it('allows request with valid token', async function () {
    this.req.cookies = { spotify_access_token: 'valid_token' };
    const next = sinon.spy();

    await this.spotifyAuthentication(this.req, {} as unknown as Response, next);

    assert.equal(next.callCount, 1, 'Middleware calls next');
    assert.equal(this.req.spotify_uid, 'some_id', 'Sets correct spotify_uid');
  });

  it('disallows request with valid token', async function () {
    this.req.cookies = { spotify_access_token: 'invalid_token' };
    const next = sinon.spy();

    await this.spotifyAuthentication(this.req, this.res_stub, next);

    assert.equal(next.callCount, 0, 'Middleware does not call next');
  });

  it('disallows request without cookies object', async function () {
    const next = sinon.spy();

    await this.spotifyAuthentication(this.req, this.res_stub, next);

    assert.equal(next.callCount, 0, 'Middleware does not call next');
  });

  it('disallows request with empty cookies', async function () {
    this.req.cookies = { spotify_access_token: '' };
    const next = sinon.spy();

    await this.spotifyAuthentication(this.req, this.res_stub, next);

    assert.equal(next.callCount, 0, 'Middleware does not call next');
  });

  it('responds with unauthorized status code', async function () {
    const app = express();
    app.use(this.spotifyAuthentication);
    app.get('/test', (req, res) => {
      res.status(200).send('Fail');
    });

    const response = await request(app).get('/test');
    console.log(response.body);
  });
});
