import sinon from 'sinon';

import * as SpotifyWebApi from '../../src/spotify_authentication/spotify_api_import';

/**
 * stubSpotifyAPI() - stubs spotify api object so it has the following behavior:
 * if setAccessToken() is set with token = 'valid_token', getMe() will return object with id = 'some_id'
 * if setAccessToken() is not set with token = 'valid_token', getMe() will throw and error with message 'Incorrect Token'
 */
export function stubSpotifyAPI() {
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
}
