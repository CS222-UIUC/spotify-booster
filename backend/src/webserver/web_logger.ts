import { NextFunction, Request, Response } from 'express';

import Logger from '../logger/logger';

/**
 * createWebLogger() - Creates a middleware function to log info about express server
 * @param log - Logger to log messages to
 * @returns - Express middleware function to log debug messages
 */
export default function createWebLogger(log: Logger) {
  // logs error from express
  function webLogError(error: Error, req: Request, res: Response, next: NextFunction) {
    const path = req.originalUrl;
    const from_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    log.error(`Error handling request from ${from_ip} for ${path}`, error);
    next();
  }

  // logs debug messages for what pages are requested
  function webLogger(req: Request, res: Response, next: NextFunction) {
    const path = req.originalUrl;
    const from_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    log.debug(`${from_ip} requested ${path}`);
    next();
  }

  return { webLogError, webLogger };
}
