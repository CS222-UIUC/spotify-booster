import { assert } from 'chai';
import sinon from 'sinon';
import path from 'path';
import fs from 'fs-extra';
import sqlite3 from 'sqlite3';

import { arraysMatchUnordered } from '../test_utils/assertions/arrays_match.test';
import { createDirectory, removeDirectory } from '../test_utils/hooks/create_test_directory.test';
import { createLoggerStub, stubLogger } from '../test_utils/stubs/stub_logger.test';
import uniqueID from '../test_utils/unique_id.test';

import { matchTestRow, SQLiteInterfaceTester } from './sqlite_interface_test_utils.test';

const TEST_DB_DIRECTORY = path.join(__dirname, 'test_sqlite_interface');

describe('SQLite Interface', () => {
  before(() => {
    createDirectory(TEST_DB_DIRECTORY);
  });

  beforeEach(() => {
    stubLogger();
  });

  after(() => {
    removeDirectory(TEST_DB_DIRECTORY);
  });

  describe('New Database Initialization', () => {
    it('creates new database if no database exists and writes to it', async () => {
      const tables = [
        {
          name: 'test_table0',
          cols: '(col1 STRING, col2 INT)',
        },
        {
          name: 'test_table1',
          cols: '(col3 STRING, col4 INT)',
        },
      ];
      const db_location = path.join(TEST_DB_DIRECTORY, uniqueID());
      const sqlite_interface = new SQLiteInterfaceTester(db_location, tables, createLoggerStub());

      await sqlite_interface.dbRun('INSERT INTO test_table0 VALUES ($col1, $col2)', {
        $col1: 'some string',
        $col2: '0',
      });

      const rows = await sqlite_interface.dbAll('SELECT * FROM test_table0', {});
      const expected_rows = [{ col1: 'some string', col2: 0 }];
      arraysMatchUnordered(expected_rows, rows, matchTestRow, 'Existing Data');

      assert(fs.existsSync(db_location), 'Creates database at correct location');

      await sqlite_interface.close();
    });
  });

  describe('Existing Database Initialization', () => {
    it('opens existing database and reads existing data', async () => {
      const tables = [
        {
          name: 'test_table',
          cols: '(col1 STRING, col2 INT)',
        },
      ];
      const db_location = path.join(__dirname, '..', '..', '..', 'tests', 'sqlite_interface', 'sqlite_interface.test.db');
      const sqlite_interface = new SQLiteInterfaceTester(db_location, tables, createLoggerStub());

      const rows = await sqlite_interface.dbAll('SELECT * FROM test_table', {});
      const expected_rows = [
        { col1: 'some string', col2: 0 },
        { col1: 'another string', col2: 1 },
        { col1: 'a string', col2: 2 },
      ];
      arraysMatchUnordered(expected_rows, rows, matchTestRow, 'Existing Data');

      await sqlite_interface.close();
    });
  });

  describe('Failed Database Initalization', () => {
    it('rejects ready if it fails to open database', async () => {
      sinon.stub(sqlite3, 'Database').yields(new Error('Failed to Open Database'));

      const db_location = path.join(__dirname, '..', '..', '..', 'tests', 'sqlite_interface', 'sqlite_interface.test.db');
      const sqlite_interface = new SQLiteInterfaceTester(db_location, [], createLoggerStub());

      await assert.isRejected(sqlite_interface.ready, 'Failed to Open Database');
    });

    it('rejects ready if it fails to create tables', async () => {
      sinon.stub(sqlite3, 'Database').callsFake((db_path, cb) => {
        setImmediate(() => cb());
        return {
          run: sinon.fake.yields(new Error('Failed to Run Command')),
        };
      });

      const tables = [
        {
          name: 'test_table0',
          cols: '(col1 STRING, col2 INT)',
        },
        {
          name: 'test_table1',
          cols: '(col3 STRING, col4 INT)',
        },
      ];
      const db_location = path.join(TEST_DB_DIRECTORY, uniqueID());
      const sqlite_interface = new SQLiteInterfaceTester(db_location, tables, createLoggerStub());

      await assert.isRejected(sqlite_interface.ready, 'Failed to Run Command');
    });

    it('rejected ready if error occurs while checking database exists already or not', async () => {
      sinon.stub(fs, 'existsSync').callsFake(sinon.fake.throws('Failed to Check Exists'));

      const db_location = path.join(TEST_DB_DIRECTORY, uniqueID());
      const sqlite_interface = new SQLiteInterfaceTester(db_location, [], createLoggerStub());

      await assert.isRejected(sqlite_interface.ready, 'Failed to Check Exists');
    });
  });

  describe('sqlite3 error handling', () => {
    it('rejects dbRun if sqlite3 returns error', async () => {
      sinon.stub(sqlite3, 'Database').callsFake((db_path, cb) => {
        setImmediate(() => {
          cb();
        });
        return {
          serialize: sinon.fake.yields(),
          run: sinon.fake.yields(new Error('Failed to Run Command')),
        };
      });
      const db_location = path.join(TEST_DB_DIRECTORY, uniqueID());
      const sqlite_interface = new SQLiteInterfaceTester(db_location, [], createLoggerStub());

      await assert.isRejected(
        sqlite_interface.dbRun('CREATE TABLE test_table (col1 STRING, col2 INT)', {}),
        'Failed to Run Command'
      );
    });

    it('rejects dbAll if sqlite3 returns error', async () => {
      sinon.stub(sqlite3, 'Database').callsFake((db_path, cb) => {
        setImmediate(() => {
          cb();
        });
        return {
          serialize: sinon.fake.yields(),
          all: sinon.fake.yields(new Error('Failed to Fetch All')),
        };
      });
      const db_location = path.join(TEST_DB_DIRECTORY, uniqueID());
      const sqlite_interface = new SQLiteInterfaceTester(db_location, [], createLoggerStub());

      await assert.isRejected(
        sqlite_interface.dbAll('SELECT count(*) FROM sqlite_master WHERE type = "table"', {}),
        'Failed to Fetch All'
      );
    });

    it('rejects close if sqlite3 returns error', async () => {
      sinon.stub(sqlite3, 'Database').callsFake((db_path, cb) => {
        setImmediate(() => {
          cb();
        });
        return {
          close: sinon.fake.yields(new Error('Failed to Close')),
        };
      });
      const db_location = path.join(TEST_DB_DIRECTORY, uniqueID());
      const sqlite_interface = new SQLiteInterfaceTester(db_location, [], createLoggerStub());

      await assert.isRejected(sqlite_interface.close(), 'Failed to Close');
    });
  });
});
