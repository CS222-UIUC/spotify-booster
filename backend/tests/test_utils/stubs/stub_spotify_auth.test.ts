import sinon from 'sinon';
import { Response, NextFunction } from 'express';

import * as spotifyAuth from '../../../src/spotify_authentication/spotify_authentication';

/**
 * stubSpotifyAuth() - stubs Spotify authentication function for custom behavior
 * @param success - if authentication should be successful or not (if next() is called or not in middleware)
 * @param uid - uid to append to req object if successful
 */
export function stubSpotifyAuth(success: boolean, uid?: string) {
  sinon.stub(spotifyAuth, 'default').callsFake(() => {
    return async function (req: spotifyAuth.AuthRequest, res: Response, next: NextFunction) {
      req.spotify_uid = uid;
      if (success) next();
    };
  });
}
