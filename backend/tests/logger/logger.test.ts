import sinon from 'sinon';

import uniqueID from '../test_utils/unique_id.test';
import { createDirectory, removeDirectory } from '../test_utils/hooks/create_test_directory.test';

import Logger from '../../src/logger/logger';
import { LOG_FILE_DIRECTORY, formatDate, filterDebug, fetchLogs, matchLogs } from './logger_utils.test';
import { directoryContainsFiles, directoryNotContainsFiles } from '../test_utils/assertions/directory_files.test';
import stubConfig from '../test_utils/stubs/stub_config.test';
import { arraysMatchOrdered } from '../test_utils/assertions/arrays_match.test';

// number of milliseconds to wait after logging message before reading log file
const WRITE_WAIT = 100;

describe('Logger', () => {
  before(() => {
    createDirectory(LOG_FILE_DIRECTORY);
  });

  beforeEach(function () {
    stubConfig({
      logger_config: {
        log_file: true,
        log_console: false,
        file_directory: LOG_FILE_DIRECTORY,
        file_name: '%DATE%.log',
        date_pattern: 'YYYY-MM-DD',
        zip_logs: false,
        max_size: '20m',
        max_files: '5',
      },
    });

    this.name = uniqueID();
    this.logger = new Logger(this.name);
  });

  afterEach(function () {
    this.logger.releaseFiles();
  });

  after(() => {
    removeDirectory(LOG_FILE_DIRECTORY);
  });

  describe('Logger constructor', () => {
    it('creates an info and debug log file at the correct location', function (done) {
      // wait a bit for files to be written
      setTimeout(() => {
        const date_string = formatDate(Date.now());
        const expected_files = [`${this.name}-Info-${date_string}.log`, `${this.name}-Debug-${date_string}.log`];
        directoryContainsFiles(LOG_FILE_DIRECTORY, expected_files);

        done();
      }, WRITE_WAIT);
    });

    it('does not create new file if log_file is false', (done) => {
      const name = uniqueID();
      stubConfig({ logger_config: { log_file: false } });
      const logger = new Logger(name);

      // wait a bit for files to be written
      setTimeout(() => {
        const date_string = formatDate(Date.now());
        const unexpected_files = [`${name}-Info-${date_string}.log`, `${name}-Debug-${date_string}.log`];
        directoryNotContainsFiles(LOG_FILE_DIRECTORY, unexpected_files);

        logger.releaseFiles();
        done();
      }, WRITE_WAIT);
    });
  });

  describe('Logging Messages', () => {
    it('writes logs to file in correct format', function (done) {
      const time = new Date();
      const timestamp = time.toISOString();

      const clock = sinon.useFakeTimers({ now: time });
      this.logger.debug('debug0');
      this.logger.info('info0');
      this.logger.warn('warn0');
      this.logger.warn('warn1', new Error('Some small error'));
      this.logger.error('error0');
      this.logger.error('error1', new Error('Some error'));
      this.logger.fatal('fatal0');
      this.logger.fatal('fatal1', new Error('Some fatal error'));
      clock.restore();

      const expected_debug = [
        { level: 'debug', message: 'debug0', timestamp },
        { level: 'info', message: 'info0', timestamp },
        { level: 'warn', message: 'warn0', timestamp },
        { level: 'warn', message: 'warn1 - Some small error', stack: 'Some small error', timestamp },
        { level: 'error', message: 'error0 - error0', stack: 'error0', timestamp },
        { level: 'error', message: 'error1 - Some error', stack: 'Some error', timestamp },
        { level: 'error', message: '[FATAL] fatal0 - fatal0', stack: 'fatal0', timestamp },
        { level: 'error', message: '[FATAL] fatal1 - Some fatal error', stack: 'Some fatal error', timestamp },
      ];
      const expected_info = filterDebug(expected_debug);

      setTimeout(() => {
        const { debug, info } = fetchLogs(this.name);

        arraysMatchOrdered(debug, expected_debug, matchLogs, 'Debug Logs');
        arraysMatchOrdered(info, expected_info, matchLogs, 'Info Logs');

        done();
      }, WRITE_WAIT);
    });
  });
});
