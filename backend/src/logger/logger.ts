import winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Profiler()
 * Tracks running time of a task starting from creation to when stop() is called
 * Logs a message once stop() is called
 */
class Profiler {
  private log_: Logger;
  private name_: string;
  private start_time_: number;
  private duration_: number;

  /**
   * @param logger - logger to log message to
   * @param name - name of task to profile
   */
  constructor(logger: Logger, name: string) {
    this.log_ = logger;
    this.name_ = name;
    this.start_time_ = Date.now();
  }

  /**
   * stop() - Stops profiling task and logs a message
   * @param options - optional options for how to log message
   * @param options.message - custom message to log (overrides auto generated message)
   * @param options.success - if task was successful or not (default is true)
   * @param options.level - log level of message (overrides auto generated log level from level_thresholds)
   * @param options.level_thresholds - thresholds for severity of logs (in milliseconds)
   * @returns duration of task (in milliseconds)
   */
  stop(options?: {
    message?: string;
    success?: boolean;
    level?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    level_thresholds?: {
      debug?: number;
      info?: number;
      warn?: number;
      error?: number;
      fatal?: number;
    };
  }): number {
    // don't log another message if stop called multiple times, just return original duration of task
    if (this.duration_) return this.duration_;
    this.duration_ = Date.now() - this.start_time_;

    // determine level based on thresholds
    let level = 'debug';
    if (options && options.level_thresholds) {
      if (this.duration_ >= options.level_thresholds.fatal) level = 'fatal';
      else if (this.duration_ >= options.level_thresholds.error)
        level = 'error';
      else if (this.duration_ >= options.level_thresholds.warn) level = 'warn';
      else if (this.duration_ >= options.level_thresholds.info) level = 'info';
      else level = 'debug';
    }
    // override level if level is given explicitly
    if (options && options.level) level = options.level;

    let success = true;
    if (options && typeof options.success !== 'undefined') {
      success = options.success;
    }

    let message =
      `Task "${this.name_}" completed ` +
      `${success ? 'successfully ' : 'unsuccessfully '}` +
      `after ${this.duration_} milliseconds`;
    if (options && options.message) {
      message = options.message;
    }

    if (level === 'debug') this.log_.debug(message);
    else if (level === 'info') this.log_.info(message);
    else if (level === 'warn') this.log_.warn(message);
    else if (level === 'error') this.log_.error(message);
    else if (level === 'fatal') this.log_.fatal(message);

    return this.duration_;
  }
}

/**
 * Logger()
 * A winston logger wrapper
 */
export default class Logger {
  private logger_: winston.Logger;

  /**
   * @param name - Name of logger
   */
  constructor(name: string) {
    // load environment variables
    const LOG_FILE = process.env.LOG_FILE === 'true';
    const LOG_CONSOLE = process.env.LOG_CONSOLE === 'true';
    const LOG_FILE_DIRECTORY = process.env.LOG_FILE_DIRECTORY;
    const LOG_FILE_NAME = process.env.LOG_FILE_NAME;
    const LOG_DATE_PATTERN = process.env.LOG_DATE_PATTERN;
    const ZIP_LOGS = process.env.ZIP_LOGS === 'true';
    const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE;
    const LOG_MAX_FILES = process.env.LOG_MAX_FILES;

    const logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };

    // Create winston logger
    this.logger_ = winston.createLogger({
      level: 'debug',
      levels: logLevels,
      exitOnError: false,
    });

    // add file logging transports if logging to file is enabled
    if (LOG_FILE) {
      // create one transport for everything
      this.logger_.add(
        new winston.transports.DailyRotateFile({
          level: 'debug',
          dirname: LOG_FILE_DIRECTORY,
          filename: `${name}-Debug-${LOG_FILE_NAME}`,
          datePattern: LOG_DATE_PATTERN,
          zippedArchive: ZIP_LOGS,
          maxSize: LOG_MAX_SIZE,
          maxFiles: LOG_MAX_FILES,
          format: winston.format.combine(
            winston.format.errors({ stack: true }),
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );

      // create another for without debug messages
      this.logger_.add(
        new winston.transports.DailyRotateFile({
          level: 'info',
          dirname: LOG_FILE_DIRECTORY,
          filename: `${name}-Info-${LOG_FILE_NAME}`,
          datePattern: LOG_DATE_PATTERN,
          zippedArchive: ZIP_LOGS,
          maxSize: LOG_MAX_SIZE,
          maxFiles: LOG_MAX_FILES,
          format: winston.format.combine(
            winston.format.errors({ stack: true }),
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );
    }

    // Done here if logging to console is not needed
    if (!LOG_CONSOLE) return;

    // Add some colors to console output
    winston.addColors({
      debug: 'blue',
      info: 'green',
      warn: 'yellow',
      error: 'red',
    });
    this.logger_.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.errors({ stack: true }),
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  /**
   * fatal() - For messages about irrecoverable errors
   * @param msg - message to log
   * @param error - optional error message
   */
  fatal(msg: string, error?: Error) {
    if (!error) error = new Error(msg);
    msg = '[FATAL] ' + msg;
    this.logger_.error(`${msg} -`, error);
  }

  /**
   * error() - For messages about recoverable errors
   * @param msg - message to log
   * @param error - optional error message
   */
  error(msg: string, error?: Error) {
    if (!error) error = new Error(msg);
    this.logger_.error(`${msg} -`, error);
  }

  /**
   * warn() - For messages about something that doesn't impact operation but may indicate a problem if it continues
   * @param msg - message to log
   * @param error - optional error message
   */
  warn(msg: string, error?: Error) {
    if (error) {
      this.logger_.warn(`${msg} -`, error);
    } else {
      this.logger_.warn(msg);
    }
  }

  /**
   * info() - For general messages that tell what the program is doing
   * @param msg - message to log
   */
  info(msg: string) {
    this.logger_.info(msg);
  }

  /**
   * debug() - For detailed messages that tell what the program is doing
   * @param msg - message to log
   */
  debug(msg: string) {
    this.logger_.debug(msg);
  }

  /**
   * profile() - Starts a profiler with given name
   * @param name - name of the
   */
  profile(name: string): Profiler {
    return new Profiler(this, name);
  }
}
