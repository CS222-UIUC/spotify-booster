import { NextFunction, Request, Response } from 'express';
import { SpotifyAPI } from './spotify_api_import';

import Logger from '../logger/logger';
import { spotify_api_config } from '../config/config';

/**
 * isEmpty() - checks if a string is empty or only contains whitespace
 * @param str - string to check
 * @returns - if string is empty or not
 */
function isEmpty(str: string): boolean {
  return str === null || str === undefined || str.match(/^\s*$/) !== null || str === '';
}

/**
 * getAccessToken() - gets the spotify_access_token from express request object, throws error if it doesn't exist
 * @param req - express request object
 * @returns - spotify access token
 */
function getAccessToken(req: Request): string {
  let spotify_access_token: string;
  try {
    spotify_access_token = req.cookies['spotify_access_token'];
  } catch (error) {
    throw new Error('Request did not contain cookies object');
  }

  if (isEmpty(spotify_access_token)) {
    throw new Error('Request contained empty spotify_access_token');
  }

  return spotify_access_token;
}

/**
 * getSpotifyUID() - makes api call to spotify and returns spotify_uid associated with the given access_token
 * @param spotify_access_token - spotify access token from cookie
 * @returns - Promise that resolves to spotify_uid
 */
async function getSpotifyUID(spotify_access_token: string): Promise<string> {
  const spotify_api = new SpotifyAPI({
    clientId: spotify_api_config.client_id,
    clientSecret: spotify_api_config.client_secret,
    redirectUri: spotify_api_config.redirect_url,
  });
  spotify_api.setAccessToken(spotify_access_token);

  const user_info = await spotify_api.getMe();

  return user_info.body.id;
}

// Updated Reqest object interface after spotifyAuthentication middleware is run
export interface AuthRequest extends Request {
  spotify_uid: string;
}

/**
 * createSpotifyAuthenticator() - creates an Express middleware function for authenticating users
 * IMPORTANT: cookie parser must be used
 * @param log - logger
 * @returns - Express middleware for authenticating spotify users (sets req.spotify_uid to be a spotify_uid string)
 */
export default function createSpotifyAuthenticator(log: Logger) {
  async function spotifyAuthentication(req: AuthRequest, res: Response, next: NextFunction) {
    const from_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let spotify_access_token: string;
    try {
      spotify_access_token = getAccessToken(req);
    } catch (error) {
      log.warn(`Request from ${from_ip} failed authentication`, error);
      return;
    }

    try {
      req.spotify_uid = await getSpotifyUID(spotify_access_token);
    } catch (error) {
      log.warn(`Request from ${from_ip} failed authentication`, error);
      return;
    }

    next();
  }

  return spotifyAuthentication;
}
