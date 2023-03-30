import { assert } from 'chai';
import sinon from 'sinon';

import createSpotifyAuthenticator, { AuthRequest } from '../../src/spotify_authentication/spotify_authentication';
import { createLoggerStub } from '../test_utils/stubs/stub_logger.test';
import { stubSpotifyAPI } from './spotify_authentication_utils.test';

describe('Spotify Authentication Middleware', () => {
  beforeEach(function () {
    stubSpotifyAPI();
    this.spotifyAuthentication = createSpotifyAuthenticator(createLoggerStub());
  });

  it('allows request with valid token', async function () {
    const req = {
      headers: {},
      socket: {
        remoteAddress: 'test',
      },
      cookies: {
        spotify_access_token: 'valid_token',
      },
    } as AuthRequest;
    const next = sinon.spy();

    await this.spotifyAuthentication(req, {} as unknown as Response, next);

    assert.equal(next.callCount, 1, 'Middleware calls next');
    assert.equal(req.spotify_uid, 'some_id', 'Sets correct spotify_uid');
  });

  it('disallows request with valid token', async function () {
    const req = {
      headers: {},
      socket: {
        remoteAddress: 'test',
      },
      cookies: {
        spotify_access_token: 'invalid_token',
      },
    } as AuthRequest;
    const next = sinon.spy();

    await this.spotifyAuthentication(req, {} as unknown as Response, next);

    assert.equal(next.callCount, 0, 'Middleware does not call next');
  });

  it('disallows request without cookies object', async function () {
    const req = {
      headers: {},
      socket: {
        remoteAddress: 'test',
      },
    } as AuthRequest;
    const next = sinon.spy();

    await this.spotifyAuthentication(req, {} as unknown as Response, next);

    assert.equal(next.callCount, 0, 'Middleware does not call next');
  });

  it('disallows request with empty cookies', async function () {
    const req = {
      headers: {},
      socket: {
        remoteAddress: 'test',
      },
      cookies: {
        spotify_access_token: '',
      },
    } as AuthRequest;
    const next = sinon.spy();

    await this.spotifyAuthentication(req, {} as unknown as Response, next);

    assert.equal(next.callCount, 0, 'Middleware does not call next');
  });
});
