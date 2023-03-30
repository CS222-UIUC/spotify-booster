import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';

import Logger from '../../src/logger/logger';

const LOG_FILE_DIRECTORY = path.join(__dirname, 'test_logs');

// ensure empty temporary log directory exists before running tests
before(async () => {
  try {
    fs.mkdirSync(LOG_FILE_DIRECTORY, { recursive: true });
    fs.emptyDirSync(LOG_FILE_DIRECTORY);
  } catch {
    /* */
  }

  // set env variables
  process.env.LOG_FILE = 'true';
  process.env.LOG_CONSOLE = 'false';
  process.env.LOG_FILE_DIRECTORY = LOG_FILE_DIRECTORY;
  process.env.LOG_FILE_NAME = '%DATE%.log';
  process.env.LOG_DATE_PATTERN = 'YYYY-MM-DD';
  process.env.ZIP_LOGS = 'false';
  process.env.LOG_MAX_SIZE = '20m';
  process.env.LOG_MAX_FILES = '5';
  process.env.NODE_ENV = 'test';
});

// delete temporary log directory after running tests
after(async () => {
  try {
    fs.rmSync(LOG_FILE_DIRECTORY, { recursive: true, force: true });
  } catch {
    /* */
  }
});

// Returns a unique string each time to be used as a logger name
let id = 0;
function unique_logger_name() {
  return `Logger-Test-${id++}`;
}

// Formats UNIX timestamp in YYYY-MM-DD format
function format_date(date: number) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return `${year}-${month}-${day}`;
}

// Fetches logs with given logger name
function fetch_log(logger_name: string): {
  debug: Array<{
    level: string;
    message: string;
    stack?: string;
    timestamp: string;
  }>;
  info: Array<{
    level: string;
    message: string;
    stack?: string;
    timestamp: string;
  }>;
} {
  const date_string = format_date(Date.now());
  const debug_logs = fs
    .readFileSync(path.join(LOG_FILE_DIRECTORY, `${logger_name}-Debug-${date_string}.log`), 'utf-8')
    .split('\r');

  const info_logs = fs
    .readFileSync(path.join(LOG_FILE_DIRECTORY, `${logger_name}-Info-${date_string}.log`), 'utf-8')
    .split('\r');

  const debug: Array<{
    level: string;
    message: string;
    stack?: string;
    timestamp: string;
  }> = [];
  const info: Array<{
    level: string;
    message: string;
    stack?: string;
    timestamp: string;
  }> = [];

  for (let i = 0; i < debug_logs.length; i++) {
    // ignore empty strings (\n counts as 1)
    if (debug_logs[i].length < 2) continue;
    debug.push(JSON.parse(debug_logs[i]));
  }

  for (let i = 0; i < info_logs.length; i++) {
    // ignore empty strings (\n counts as 1)
    if (info_logs[i].length < 2) continue;
    info.push(JSON.parse(info_logs[i]));
  }

  return { debug, info };
}

// compares parsed log file with expected output
function compare_logs(
  log_file: Array<{
    level: string;
    message: string;
    stack?: string;
    timestamp: string;
  }>,
  expected: Array<{
    level: string;
    message: string;
    stack?: string;
  }>,
  min_time: number,
  max_time: number
) {
  for (let i = 0; i < expected.length; i++) {
    assert(log_file[i].level === expected[i].level, `Log levels match for: ${JSON.stringify(log_file[i])}`);

    assert(log_file[i].message.startsWith(expected[i].message), `Log messages match for: ${JSON.stringify(log_file[i])}`);

    assert(
      new Date(log_file[i].timestamp).getTime() >= min_time,
      `Log timestamp is not too early for: ${JSON.stringify(log_file[i])}`
    );
    assert(
      new Date(log_file[i].timestamp).getTime() <= max_time,
      `Log timestamp is not too late for: ${JSON.stringify(log_file[i])}`
    );

    if (expected[i].stack) {
      assert(log_file[i].stack, `Log error message exists for: ${JSON.stringify(log_file[i])}`);

      assert(
        log_file[i].stack.startsWith('Error: ' + expected[i].stack),
        `Log error message matches for: ${JSON.stringify(log_file[i])}`
      );
    }
  }

  assert(log_file.length === expected.length, 'Log file and expected had same length');
}

// creates a new array of expected output without debug logs
function filter_debug(
  expected: Array<{
    level: string;
    message: string;
    stack?: string;
  }>
): Array<{
  level: string;
  message: string;
  stack?: string;
}> {
  const new_array: Array<{
    level: string;
    message: string;
    stack?: string;
  }> = [];
  for (let i = 0; i < expected.length; i++) {
    if (expected[i].level !== 'debug') {
      new_array.push(expected[i]);
    }
  }

  return new_array;
}

describe('Logger constructor', () => {
  it('creates an info and debug log file at the correct location', (done) => {
    const name = unique_logger_name();
    new Logger(name);

    const date_string = format_date(Date.now());
    const expected_files = [`${name}-Info-${date_string}.log`, `${name}-Debug-${date_string}.log`];
    // wait a bit for files to be written
    setTimeout(() => {
      const files = fs.readdirSync(LOG_FILE_DIRECTORY);

      // check that all expected files exist
      for (const expected of expected_files) {
        let valid = false;

        for (const file of files) {
          if (file === expected) {
            valid = true;
          }
        }

        assert(valid, `Expected file found for: ${expected}`);
      }
      done();
    }, 500);
  });
});

describe('Logging Messages', () => {
  it('writes logs to file in correct format', (done) => {
    const start_time = Date.now();

    const name = unique_logger_name();
    const logger = new Logger(name);

    logger.debug('debug0');
    logger.info('info0');
    logger.warn('warn0');
    logger.warn('warn1', new Error('Some small error'));
    logger.error('error0');
    logger.error('error1', new Error('Some error'));
    logger.fatal('fatal0');
    logger.fatal('fatal1', new Error('Some fatal error'));

    const expected_debug = [
      { level: 'debug', message: 'debug0' },
      { level: 'info', message: 'info0' },
      { level: 'warn', message: 'warn0' },
      {
        level: 'warn',
        message: 'warn1 - Some small error',
        stack: 'Some small error',
      },
      {
        level: 'error',
        message: 'error0 - error0',
        stack: 'error0',
      },
      {
        level: 'error',
        message: 'error1 - Some error',
        stack: 'Some error',
      },
      {
        level: 'error',
        message: '[FATAL] fatal0 - fatal0',
        stack: 'fatal0',
      },
      {
        level: 'error',
        message: '[FATAL] fatal1 - Some fatal error',
        stack: 'Some fatal error',
      },
    ];
    const expected_info = filter_debug(expected_debug);

    setTimeout(() => {
      const { debug, info } = fetch_log(name);

      compare_logs(debug, expected_debug, start_time, Date.now());
      compare_logs(info, expected_info, start_time, Date.now());
      done();
    }, 500);
  });
});

describe('Profiler', () => {
  it('returns accurate time and writes log message by default', (done) => {
    const start_time = Date.now();

    const name = unique_logger_name();
    const logger = new Logger(name);

    const p0 = logger.profile('profile0');
    const p1 = logger.profile('profile1');
    const p2 = logger.profile('profile2');
    const p3 = logger.profile('profile3');
    const p4 = logger.profile('profile4');
    const p5 = logger.profile('profile5');
    const p6 = logger.profile('profile6');
    const p7 = logger.profile('profile7');
    const p8 = logger.profile('profile8');
    const p9 = logger.profile('profile9');
    const p10 = logger.profile('profile10');
    const p11 = logger.profile('profile11');
    const p12 = logger.profile('profile12');
    const p13 = logger.profile('profile13');

    const timeout_dur = 500;
    setTimeout(() => {
      const time = p0.stop();
      assert(time >= timeout_dur, 'Profiler 0 duration is not shorter than expected');
      assert(time <= timeout_dur + 100, 'Profiler 0 duration is not longer than expected');
      assert(time === p0.stop(), 'Calling stop again returns same duration');

      p1.stop({ message: 'with message' });
      p2.stop({ success: false });
      p3.stop({ message: 'not successful with message', success: false });

      p4.stop({ level: 'info' });
      p5.stop({ message: 'info with message', level: 'info' });

      p6.stop({
        level_thresholds: {
          debug: 100,
          info: 100,
          warn: 100,
          error: 100,
          fatal: 100,
        },
      });
      p7.stop({
        level_thresholds: {
          debug: 100,
          info: 100,
          warn: 100,
          error: 100,
          fatal: 10000,
        },
      });
      p8.stop({
        level_thresholds: {
          debug: 100,
          info: 100,
          warn: 100,
          error: 10000,
          fatal: 10000,
        },
      });
      p9.stop({
        level_thresholds: {
          debug: 100,
          info: 100,
          warn: 10000,
          error: 10000,
          fatal: 10000,
        },
      });
      p10.stop({
        level_thresholds: {
          debug: 100,
          info: 10000,
          warn: 10000,
          error: 10000,
          fatal: 10000,
        },
      });

      p11.stop({
        level: 'warn',
        level_thresholds: {
          debug: 100,
          info: 100,
          warn: 100,
          error: 100,
          fatal: 100,
        },
      });
      p12.stop({
        success: false,
        level: 'error',
        level_thresholds: {
          debug: 100,
          info: 100,
          warn: 100,
          error: 100,
          fatal: 100,
        },
      });
      p13.stop({
        message: 'some message',
        success: false,
        level: 'error',
        level_thresholds: {
          debug: 100,
          info: 100,
          warn: 100,
          error: 100,
          fatal: 100,
        },
      });
    }, 500);

    const expected_debug = [
      {
        level: 'debug',
        message: 'Task "profile0" completed successfully after ',
      },
      { level: 'debug', message: 'with message' },
      {
        level: 'debug',
        message: 'Task "profile2" completed unsuccessfully after ',
      },
      {
        level: 'debug',
        message: 'not successful with message',
      },
      {
        level: 'info',
        message: 'Task "profile4" completed successfully after ',
      },
      {
        level: 'info',
        message: 'info with message',
      },
      {
        level: 'error',
        message: '[FATAL] Task "profile6" completed successfully after ',
      },
      {
        level: 'error',
        message: 'Task "profile7" completed successfully after ',
      },
      {
        level: 'warn',
        message: 'Task "profile8" completed successfully after ',
      },
      {
        level: 'info',
        message: 'Task "profile9" completed successfully after ',
      },
      {
        level: 'debug',
        message: 'Task "profile10" completed successfully after ',
      },
      {
        level: 'warn',
        message: 'Task "profile11" completed successfully after ',
      },
      {
        level: 'error',
        message: 'Task "profile12" completed unsuccessfully after ',
      },
      {
        level: 'error',
        message: 'some message',
      },
    ];
    const expected_info = filter_debug(expected_debug);

    setTimeout(() => {
      const { debug, info } = fetch_log(name);
      compare_logs(debug, expected_debug, start_time, Date.now());
      compare_logs(info, expected_info, start_time, Date.now());
      done();
    }, 1000);
  });
});
