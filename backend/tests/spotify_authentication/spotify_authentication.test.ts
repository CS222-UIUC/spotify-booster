import { assert } from 'chai';
import sinon from 'sinon';

import * as SpotifyWebApi from '../../src/spotify_authentication/spotify_api_import';

import createSpotifyAuthenticator, { AuthRequest } from '../../src/spotify_authentication/spotify_authentication';
import Logger from '../../src/logger/logger';

describe('Spotify Authentication Middleware', () => {
  it('allows request with valid token', async () => {
    sinon.stub(SpotifyWebApi, 'SpotifyAPI').callsFake(() => {
      return {
        access_token: '',
        setAccessToken(token: string) {
          this.access_token = token;
        },
        getMe() {
          if (this.access_token === 'valid_token') {
            return {
              body: {
                id: 'some_id',
              },
            };
          }
          throw new Error('Incorrect Token');
        },
      };
    });

    const spotifyAuthentication = createSpotifyAuthenticator(new Logger('Test'));

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await spotifyAuthentication(req, {} as any, next);

    assert.equal(next.callCount, 1, 'Middleware calls next');
    assert.equal(req.spotify_uid, 'some_id', 'Sets correct spotify_uid');
  });

  it('disallows request with valid token', async () => {
    sinon.stub(SpotifyWebApi, 'SpotifyAPI').callsFake(() => {
      return {
        access_token: '',
        setAccessToken(token: string) {
          this.access_token = token;
        },
        getMe() {
          if (this.access_token === 'valid_token') {
            return {
              body: {
                id: 'some_id',
              },
            };
          }
          throw new Error('Incorrect Token');
        },
      };
    });

    const spotifyAuthentication = createSpotifyAuthenticator(new Logger('Test'));

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await spotifyAuthentication(req, {} as any, next);

    assert.equal(next.callCount, 0, 'Middleware does not call next');
  });

  it('disallows request without cookies object', async () => {
    sinon.stub(SpotifyWebApi, 'SpotifyAPI').callsFake(() => {
      return {
        access_token: '',
        setAccessToken(token: string) {
          this.access_token = token;
        },
        getMe() {
          if (this.access_token === 'valid_token') {
            return {
              body: {
                id: 'some_id',
              },
            };
          }
          throw new Error('Incorrect Token');
        },
      };
    });

    const spotifyAuthentication = createSpotifyAuthenticator(new Logger('Test'));

    const req = {
      headers: {},
      socket: {
        remoteAddress: 'test',
      },
    } as AuthRequest;
    const next = sinon.spy();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await spotifyAuthentication(req, {} as any, next);

    assert.equal(next.callCount, 0, 'Middleware does not call next');
  });

  it('disallows request with empty cookies', async () => {
    sinon.stub(SpotifyWebApi, 'SpotifyAPI').callsFake(() => {
      return {
        access_token: '',
        setAccessToken(token: string) {
          this.access_token = token;
        },
        getMe() {
          if (this.access_token === 'valid_token') {
            return {
              body: {
                id: 'some_id',
              },
            };
          }
          throw new Error('Incorrect Token');
        },
      };
    });

    const spotifyAuthentication = createSpotifyAuthenticator(new Logger('Test'));

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await spotifyAuthentication(req, {} as any, next);

    assert.equal(next.callCount, 0, 'Middleware does not call next');
  });
});
