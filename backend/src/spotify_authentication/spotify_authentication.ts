import express, { NextFunction, Request, Response } from 'express';

import Logger from '../logger/logger';

/**
 * createSpotifyAuthenticationRouter() - Creates router for spotify authentication
 * Handles all endpoints for spotify authentication
 * Stores user's token type, access token, refresh token, and expiration timestamp to browser's local storage
 * @param log - logger
 */
export function createSpotifyAuthenticationRouter(log: Logger): express.Router {
  const router = express.Router();

  router.get('spotify_login', (req, res) => {
    // send user here if they click the login with spotify button
    // redirect to spotify login endpoint
  });

  router.get('spotify_callback', (req, res) => {
    // spotify redirect uri (where spotify will send you once logged in successfully)
    // save user access token, refresh token, and expiration timestamp to browser's local storage
  });

  router.get('spotify_refresh', (req, res) => {
    // send the user here if the spotify token has expired and we need a new one
  });

  return router;
}

type CustomRequest = {
  spotify: {
    authenticated: boolean;
    access_token: string;
    token_type: string;
  };
} & Request;

/**
 * authenticationMiddleware() - Express middleware function that handles making sure a user is authenticated
 * if user is not authenticated, ignore it
 * if user's token has expired, redirect to spotify refresh endpoint
 * otherwise, make user's spotify access token and token type avaliable on req object
 * @param req - express reqest object
 * @param res - express response object
 * @param next - express next() callback for middleware (call this once middleware is done)
 */
export function authenticationMiddleware(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  const authenticated = false;
  const token_type = 'get token type somehow';
  const access_token = 'get token somehow';

  req.spotify = { authenticated, token_type, access_token };
  next();
}
