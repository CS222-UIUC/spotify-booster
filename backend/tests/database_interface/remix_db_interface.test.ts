import { assert } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

import DatabaseInterface from '../../src/database_interface/database_interface';

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

describe('Creating Remixes', () => {
  it('creates a new remix with a unique id and given name and trims name', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);

    const id0 = await db.createRemix('test_remix');
    const id1 = await db.createRemix(' test_remix ');

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(id0 !== id1, 'Remix ids are unique');
    assert(
      (await db.getRemixName(id0)) === 'test_remix',
      'Database contains new remix 0'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix',
      'Database contains new remix 1'
    );

    await db.close();
  });

  it('rejects blank remix name when creating remix', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);

    const invalid_names = [
      '', // blank
      null, // null
      ' ', // whitespace
      '\n',
      '\t',
      '\r',
    ];
    for (const name of invalid_names) {
      await assert.isRejected(db.createRemix(name), 'Invalid Remix Name');
    }

    assert((await db.remixCount()) === 0, 'Creates exactly 0 remixes');
    await db.close();
  });

  it('rejects promise if getting name of invalid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    const invalid_ids = [
      '', // blank
      '\n',
      ' ',
      '%', // invalid base64 characters
      '!',
      '=!',
      'asdf', // too short
      id0 + 'a', // similar to existing id
      'a' + id0,
      id0 + id1,
      crypto.createHash('sha256').update((100).toString()).digest('base64'), // correct format but non existing id
    ];
    for (const invalid of invalid_ids) {
      await assert.isRejected(db.getRemixName(invalid), 'Invalid Remix Id');
    }

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(
      (await db.getRemixName(id0)) === 'test_remix0',
      'Does not update other remixes'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not update other remixes'
    );
    await db.close();
  });
});

describe('Editing Remixes', () => {
  it('updates name of valid remix id with trimmed name', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    await db.setRemixName(id0, ' new_name ');

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(
      (await db.getRemixName(id0)) === 'new_name',
      'Updates remix name with new name'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not update other remixes'
    );
    await db.close();
  });

  it('rejects promise if changing name of with invalid name', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    const invalid_names = [
      '', // blank
      null, // null
      ' ', // whitespace
      '\n',
      '\t',
      '\r',
    ];
    for (const name of invalid_names) {
      await assert.isRejected(db.setRemixName(id0, name), 'Invalid Remix Name');
    }

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(
      (await db.getRemixName(id0)) === 'test_remix0',
      'Does not update remix name with new name'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not update other remixes'
    );
    await db.close();
  });

  it('rejects promise if changing name of invalid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    const invalid_ids = [
      '', // blank
      '\n',
      ' ',
      '%', // invalid base64 characters
      '!',
      '=!',
      'asdf', // too short
      id0 + 'a', // similar to existing id
      'a' + id0,
      id0 + id1,
      crypto.createHash('sha256').update((100).toString()).digest('base64'), // correct format but non existing id
    ];
    for (const invalid of invalid_ids) {
      await assert.isRejected(
        db.setRemixName(invalid, 'new_name'),
        'Invalid Remix Id'
      );
    }

    assert((await db.remixCount()) === 2, 'Creates exactly 2 remixes');
    assert(
      (await db.getRemixName(id0)) === 'test_remix0',
      'Does not update remix name with new name'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not update other remixes'
    );
    await db.close();
  });
});

describe('Deleting Remixes', () => {
  it('deletes a valid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    await db.deleteRemix(id0);

    assert((await db.remixCount()) === 1, 'Exactly 1 remix remains');
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not delete other remixes'
    );
    await db.close();
  });

  it('rejects promise if deleting invalid remix id', async () => {
    const db_location = path.join(TEMP_FILE_DIRECTORY, unique_database_name());
    const db = new DatabaseInterface(db_location);
    const id0 = await db.createRemix('test_remix0');
    const id1 = await db.createRemix('test_remix1');

    const invalid_ids = [
      '', // blank
      '\n',
      ' ',
      '%', // invalid base64 characters
      '!',
      '=!',
      'asdf', // too short
      id0 + 'a', // similar to existing id
      'a' + id0,
      id0 + id1,
      crypto.createHash('sha256').update((100).toString()).digest('base64'), // correct format but non existing id
    ];
    for (const invalid of invalid_ids) {
      await assert.isRejected(db.deleteRemix(invalid), 'Invalid Remix Id');
    }

    assert((await db.remixCount()) === 2, 'Exactly 2 remixes remains');
    assert(
      (await db.getRemixName(id0)) === 'test_remix0',
      'Does not delete other remixes'
    );
    assert(
      (await db.getRemixName(id1)) === 'test_remix1',
      'Does not delete other remixes'
    );
    await db.close();
  });
});
