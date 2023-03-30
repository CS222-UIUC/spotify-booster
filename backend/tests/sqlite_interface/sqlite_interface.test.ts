import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import sinon from 'sinon';
import path from 'path';
import fs from 'fs-extra';

import { SQLiteInterfaceTester } from './sqlite_interface_test_utils.test';
import sqlite3 from 'sqlite3';
import Logger from '../../src/logger/logger';

const TEMP_FILE_DIRECTORY = path.join(__dirname, 'test_databases');

// ensure empty temporary directory exists before running tests
before(async () => {
  try {
    fs.mkdirSync(TEMP_FILE_DIRECTORY, { recursive: true });
    fs.emptyDirSync(TEMP_FILE_DIRECTORY);
  } catch {
    /* */
  }
});

afterEach(() => {
  sinon.restore();
});

// delete temporary directory after running tests
after(async () => {
  try {
    fs.rmSync(TEMP_FILE_DIRECTORY, { recursive: true, force: true });
  } catch {
    /* */
  }
});

// Returns a unique string each time to be used as a database name
function unique_database_name() {
  return `Database-Test-${Date.now()}.db`;
}

/**
 * arraysMatchUnordered() - Checks if 2 arrays match without regard to order
 * @param a - first list
 * @param b - second list
 * @param comparator - function to compare elements, defaults to ===
 * @returns - If arrays match without regard to order
 */
export default function arraysMatchUnordered<T>(
  a: Array<T>,
  b: Array<T>,
  comparator?: (a: T, b: T) => boolean
): boolean {
  if (!comparator) {
    comparator = (a, b) => {
      return a === b;
    };
  }
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    let found = false;
    for (let j = 0; j < b.length; j++) {
      if (comparator(a[i], b[j])) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

describe('SQLite Interface', () => {
  it('opens existing database', async () => {
    const tables = [
      {
        name: 'test_table',
        cols: '(col1 STRING, col2 INT)',
      },
    ];
    const db_location = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'tests',
      'sqlite_interface',
      'sqlite_interface.test.db'
    );
    const sqlite_interface = new SQLiteInterfaceTester(
      db_location,
      tables,
      new Logger('Test SQLiteInterface')
    );

    const rows = await sqlite_interface.dbAll('SELECT * FROM test_table', {});

    const expected_rows = [
      { col1: 'some string', col2: 0 },
      { col1: 'another string', col2: 1 },
      { col1: 'a string', col2: 2 },
    ];
    assert(
      arraysMatchUnordered<(typeof expected_rows)[0]>(
        expected_rows,
        rows,
        (a, b) => a.col1 === b.col1 && a.col2 === b.col2
      ),
      'Reads existing database correctly'
    );

    await sqlite_interface.close();
  });

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
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const sqlite_interface = new SQLiteInterfaceTester(
      db_location,
      tables,
      new Logger('Test SQLiteInterface')
    );

    await sqlite_interface.dbRun(
      'INSERT INTO test_table0 VALUES ($col1, $col2)',
      {
        $col1: 'some string',
        $col2: '0',
      }
    );

    const rows = await sqlite_interface.dbAll('SELECT * FROM test_table0', {});
    const expected_rows = [{ col1: 'some string', col2: 0 }];
    assert(
      arraysMatchUnordered(
        expected_rows,
        rows,
        (a, b) => a.col1 === b.col1 && a.col2 === b.col2
      ),
      'Writes to new database correctly'
    );

    assert(fs.existsSync(db_location), 'Creates database at correct location');

    await sqlite_interface.close();
  });

  it('rejects ready if it fails to open database', async () => {
    sinon
      .stub(sqlite3, 'Database')
      .yields(new Error('Failed to Open Database'));

    const db_location = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'tests',
      'sqlite_interface',
      'sqlite_interface.test.db'
    );
    const sqlite_interface = new SQLiteInterfaceTester(
      db_location,
      [],
      new Logger('Test SQLiteInterface')
    );

    await assert.isRejected(sqlite_interface.ready, 'Failed to Open Database');
  });

  it('rejects ready if it fails to create tables', async () => {
    sinon.stub(sqlite3, 'Database').callsFake((db_path, cb) => {
      setImmediate(() => {
        cb();
      });
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
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const sqlite_interface = new SQLiteInterfaceTester(
      db_location,
      tables,
      new Logger('Test SQLiteInterface')
    );

    await assert.isRejected(sqlite_interface.ready, 'Failed to Run Command');
  });

  it('rejected ready if error occurs while checking database exists already or not', async () => {
    sinon
      .stub(fs, 'existsSync')
      .callsFake(sinon.fake.throws('Failed to Check Exists'));

    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const sqlite_interface = new SQLiteInterfaceTester(
      db_location,
      [],
      new Logger('Test SQLiteInterface')
    );

    await assert.isRejected(sqlite_interface.ready, 'Failed to Check Exists');
  });

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
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const sqlite_interface = new SQLiteInterfaceTester(
      db_location,
      [],
      new Logger('Test SQLiteInterface')
    );

    await assert.isRejected(
      sqlite_interface.dbRun(
        'CREATE TABLE test_table (col1 STRING, col2 INT)',
        {}
      ),
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
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const sqlite_interface = new SQLiteInterfaceTester(
      db_location,
      [],
      new Logger('Test SQLiteInterface')
    );

    await assert.isRejected(
      sqlite_interface.dbAll(
        'SELECT count(*) FROM sqlite_master WHERE type = "table"',
        {}
      ),
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
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const sqlite_interface = new SQLiteInterfaceTester(
      db_location,
      [],
      new Logger('Test SQLiteInterface')
    );

    await assert.isRejected(sqlite_interface.close(), 'Failed to Close');
  });
});
