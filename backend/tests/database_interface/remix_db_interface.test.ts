import { assert } from 'chai';
import path from 'path';
import crypto from 'crypto';

import DatabaseInterface from '../../src/database_interface/database_interface';
import { createDirectory, removeDirectory } from '../test_utils/hooks/create_test_directory.test';
import { stubLogger } from '../test_utils/stubs/stub_logger.test';
import uniqueID from '../test_utils/unique_id.test';

const TEST_DB_DIRECTORY = path.join(__dirname, 'test_remix_db_interface');

describe('Remix DB Interface', () => {
  before(() => {
    createDirectory(TEST_DB_DIRECTORY);
  });

  beforeEach(function () {
    stubLogger();
    this.db_location = path.join(TEST_DB_DIRECTORY, uniqueID());
    this.db = new DatabaseInterface(this.db_location);
  });

  afterEach(async function () {
    await this.db.close();
  });

  after(() => {
    removeDirectory(TEST_DB_DIRECTORY);
  });

  describe('Creating Remixes', () => {
    it('creates a new remix with a unique id and given name and trims name', async function () {
      const id0 = await this.db.createRemix('test_remix');
      const id1 = await this.db.createRemix(' test_remix ');

      assert.equal(await this.db.remixCount(), 2, 'Creates exactly 2 remixes');
      assert.notEqual(id0, id1, 'Remix ids are unique');
      assert.equal(await this.db.getRemixName(id0), 'test_remix', 'Database contains new remix 0');
      assert.equal(await this.db.getRemixName(id1), 'test_remix', 'Database contains new remix 1');
    });

    it('rejects blank remix name when creating remix', async function () {
      const invalid_names = [
        '', // blank
        null, // null
        ' ', // whitespace
        '\n',
        '\t',
        '\r',
      ];
      for (const name of invalid_names) {
        await assert.isRejected(this.db.createRemix(name), 'Invalid Remix Name');
      }

      assert.equal(await this.db.remixCount(), 0, 'Creates exactly 0 remixes');
    });

    it('rejects promise if getting name of invalid remix id', async function () {
      const id0 = await this.db.createRemix('test_remix0');
      const id1 = await this.db.createRemix('test_remix1');

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
        await assert.isRejected(this.db.getRemixName(invalid), 'Invalid Remix Id');
      }

      assert.equal(await this.db.remixCount(), 2, 'Creates exactly 2 remixes');
      assert.equal(await this.db.getRemixName(id0), 'test_remix0', 'Does not update other remixes');
      assert.equal(await this.db.getRemixName(id1), 'test_remix1', 'Does not update other remixes');
    });
  });

  describe('Editing Remixes', () => {
    beforeEach(async function () {
      this.id0 = await this.db.createRemix('test_remix0');
      this.id1 = await this.db.createRemix('test_remix1');
    });

    it('updates name of valid remix id with trimmed name', async function () {
      await this.db.setRemixName(this.id0, ' new_name ');

      assert.equal(await this.db.remixCount(), 2, 'Creates exactly 2 remixes');
      assert.equal(await this.db.getRemixName(this.id0), 'new_name', 'Updates remix name with new name');
      assert.equal(await this.db.getRemixName(this.id1), 'test_remix1', 'Does not update other remixes');
    });

    it('rejects promise if changing name of with invalid name', async function () {
      const invalid_names = [
        '', // blank
        null, // null
        ' ', // whitespace
        '\n',
        '\t',
        '\r',
      ];
      for (const name of invalid_names) {
        await assert.isRejected(this.db.setRemixName(this.id0, name), 'Invalid Remix Name');
      }

      assert.equal(await this.db.remixCount(), 2, 'Creates exactly 2 remixes');
      assert.equal(await this.db.getRemixName(this.id0), 'test_remix0', 'Does not update remix name with new name');
      assert.equal(await this.db.getRemixName(this.id1), 'test_remix1', 'Does not update other remixes');
    });

    it('rejects promise if changing name of invalid remix id', async function () {
      const invalid_ids = [
        '', // blank
        '\n',
        ' ',
        '%', // invalid base64 characters
        '!',
        '=!',
        'asdf', // too short
        this.id0 + 'a', // similar to existing id
        'a' + this.id0,
        this.id0 + this.id1,
        crypto.createHash('sha256').update((100).toString()).digest('base64'), // correct format but non existing id
      ];
      for (const invalid of invalid_ids) {
        await assert.isRejected(this.db.setRemixName(invalid, 'new_name'), 'Invalid Remix Id');
      }

      assert.equal(await this.db.remixCount(), 2, 'Creates exactly 2 remixes');
      assert.equal(await this.db.getRemixName(this.id0), 'test_remix0', 'Does not update remix name with new name');
      assert.equal(await this.db.getRemixName(this.id1), 'test_remix1', 'Does not update other remixes');
    });
  });

  describe('Deleting Remixes', () => {
    beforeEach(async function () {
      this.id0 = await this.db.createRemix('test_remix0');
      this.id1 = await this.db.createRemix('test_remix1');
    });

    it('deletes a valid remix id', async function () {
      await this.db.deleteRemix(this.id0);

      assert.equal(await this.db.remixCount(), 1, 'Exactly 1 remix remains');
      assert.equal(await this.db.getRemixName(this.id1), 'test_remix1', 'Does not delete other remixes');
    });

    it('rejects promise if deleting invalid remix id', async function () {
      const invalid_ids = [
        '', // blank
        '\n',
        ' ',
        '%', // invalid base64 characters
        '!',
        '=!',
        'asdf', // too short
        this.id0 + 'a', // similar to existing id
        'a' + this.id0,
        this.id0 + this.id1,
        crypto.createHash('sha256').update((100).toString()).digest('base64'), // correct format but non existing id
      ];
      for (const invalid of invalid_ids) {
        await assert.isRejected(this.db.deleteRemix(invalid), 'Invalid Remix Id');
      }

      assert.equal(await this.db.remixCount(), 2, 'Exactly 2 remixes remains');
      assert.equal(await this.db.getRemixName(this.id0), 'test_remix0', 'Does not delete other remixes');
      assert.equal(await this.db.getRemixName(this.id1), 'test_remix1', 'Does not delete other remixes');
    });
  });
});
