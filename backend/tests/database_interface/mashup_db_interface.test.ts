import { assert } from 'chai';
import path from 'path';
import crypto from 'crypto';

import DatabaseInterface from '../../src/database_interface/database_interface';
import { createDirectory, removeDirectory } from '../test_utils/hooks/create_test_directory.test';
import { stubLogger } from '../test_utils/stubs/stub_logger.test';
import uniqueID from '../test_utils/unique_id.test';
import { arraysMatchUnordered } from '../test_utils/assertions/arrays_match.test';
import { matchUserMashup } from './database_interface_utils.test';

const TEST_DB_DIRECTORY = path.join(__dirname, 'test_mashup_db_interface');

describe('Mashup DB Interface', () => {
  before(() => {
    createDirectory(TEST_DB_DIRECTORY);
  });

  beforeEach(async function () {
    stubLogger();
    this.db_location = path.join(TEST_DB_DIRECTORY, uniqueID());
    this.db = new DatabaseInterface(this.db_location);
    this.id0 = await this.db.createMashup('test_mashup0', 'some_user_id0');
    this.id1 = await this.db.createMashup('  test_mashup1  ', 'some_user_id1');
    this.id2 = await this.db.createMashup('test_mashup2', 'some_user_id0');
  });

  afterEach(async function () {
    await this.db.close();
  });

  after(() => {
    removeDirectory(TEST_DB_DIRECTORY);
  });

  describe('Get User Mashups', () => {
    it('Gets User Mashups', async function () {
      const expected0 = [
        { mashup_id: this.id0, name: 'test_mashup0' },
        { mashup_id: this.id2, name: 'test_mashup2' },
      ];
      const expected1 = [{ mashup_id: this.id1, name: 'test_mashup1' }];

      arraysMatchUnordered(await this.db.getUserMashups('some_user_id0'), expected0, 'Gets User 0 Mashups', matchUserMashup);
      arraysMatchUnordered(await this.db.getUserMashups('some_user_id1'), expected1, 'Gets User 1 Mashups', matchUserMashup);
      arraysMatchUnordered(await this.db.getUserMashups('some_user_id2'), [], 'Unknown User', matchUserMashup);
    });
  });

  describe('Creating Mashups', () => {
    it('creates a new mashup with a unique id and given name and trims name', async function () {
      assert.equal(await this.db.mashupCount(), 3, 'Creates exactly 2 mashups');
      assert.notEqual(this.id0, this.id1, 'Mashup ids are unique');
      assert.equal(await this.db.getMashupName(this.id0), 'test_mashup0', 'Database contains new mashup 0');
      assert.equal(await this.db.getMashupName(this.id1), 'test_mashup1', 'Database contains new mashup 1');
    });

    it('rejects blank mashup name when creating mashup', async function () {
      const invalid_names = [
        '', // blank
        null, // null
        ' ', // whitespace
        '\n',
        '\t',
        '\r',
      ];
      for (const name of invalid_names) {
        await assert.isRejected(this.db.createMashup(name, 'some_spotify_user'), 'Invalid Mashup Name');
      }

      assert.equal(await this.db.mashupCount(), 3, 'Creates exactly 0 new mashups');
    });

    it('rejects promise if getting name of invalid mashup id', async function () {
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
        await assert.isRejected(this.db.getMashupName(invalid), 'Invalid Mashup Id');
      }

      assert.equal(await this.db.mashupCount(), 3, 'Creates exactly 2 mashups');
      assert.equal(await this.db.getMashupName(this.id0), 'test_mashup0', 'Does not update other mashups');
      assert.equal(await this.db.getMashupName(this.id1), 'test_mashup1', 'Does not update other mashups');
    });
  });

  describe('Mashup Permissions', () => {
    it('returns true for valid user and mashup_id', async function () {
      assert(await this.db.mashupPermission(this.id0, 'some_user_id0'), 'test_mashup0 and user0 allowed');
      assert(await this.db.mashupPermission(this.id1, 'some_user_id1'), 'test_mashup1 and user1 allowed');
    });

    it('returns false for invalid user and mashup_id', async function () {
      assert(!(await this.db.mashupPermission(this.id0, 'some_user_id1')), 'test_mashup0 and user1 not allowed');
      assert(!(await this.db.mashupPermission(this.id1, 'some_user_id0')), 'test_mashup1 and user0 not allowed');
      assert(!(await this.db.mashupPermission('invalid_id', 'some_user_id1')), 'some_mashup and user1 not allowed');
    });
  });

  describe('Editing Mashups', () => {
    it('updates name of valid mashup id with trimmed name', async function () {
      await this.db.setMashupName(this.id0, ' new_name ');

      assert.equal(await this.db.mashupCount(), 3, 'Creates exactly 2 mashups');
      assert.equal(await this.db.getMashupName(this.id0), 'new_name', 'Updates mashup name with new name');
      assert.equal(await this.db.getMashupName(this.id1), 'test_mashup1', 'Does not update other mashups');
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
        await assert.isRejected(this.db.setMashupName(this.id0, name), 'Invalid Mashup Name');
      }

      assert.equal(await this.db.mashupCount(), 3, 'Creates exactly 2 mashups');
      assert.equal(await this.db.getMashupName(this.id0), 'test_mashup0', 'Does not update mashup name with new name');
      assert.equal(await this.db.getMashupName(this.id1), 'test_mashup1', 'Does not update other mashups');
    });

    it('rejects promise if changing name of invalid mashup id', async function () {
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
        await assert.isRejected(this.db.setMashupName(invalid, 'new_name'), 'Invalid Mashup Id');
      }

      assert.equal(await this.db.mashupCount(), 3, 'Creates exactly 2 mashups');
      assert.equal(await this.db.getMashupName(this.id0), 'test_mashup0', 'Does not update mashup name with new name');
      assert.equal(await this.db.getMashupName(this.id1), 'test_mashup1', 'Does not update other mashups');
    });
  });

  describe('Deleting Mashups', () => {
    it('deletes a valid mashup id', async function () {
      await this.db.deleteMashup(this.id0);

      assert.equal(await this.db.mashupCount(), 2, 'Exactly 2 mashups remains');
      assert.equal(await this.db.getMashupName(this.id1), 'test_mashup1', 'Does not delete other mashups');
    });

    it('rejects promise if deleting invalid mashup id', async function () {
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
        await assert.isRejected(this.db.deleteMashup(invalid), 'Invalid Mashup Id');
      }

      assert.equal(await this.db.mashupCount(), 3, 'Exactly 2 mashups remains');
      assert.equal(await this.db.getMashupName(this.id0), 'test_mashup0', 'Does not delete other mashups');
      assert.equal(await this.db.getMashupName(this.id1), 'test_mashup1', 'Does not delete other mashups');
    });
  });

  describe('Mashup Searching', () => {
    it('returns songs matching search string', async function () {
      const mashup_names_to_search = [
        'a mashup 0',
        'a mashup 1',
        'a mashup 2',
        'another mashup 0',
        'another mashup 1',
        'another mashup 2',
        'another mashup 3',
      ];
      for (let i = 0; i < mashup_names_to_search.length; i++) {
        await this.db.createMashup(mashup_names_to_search[i], 'test_user');
      }

      const matches_all = (await this.db.searchUserMashups('test_user', 'a')).map((m: { name: string }) => m.name);
      arraysMatchUnordered(matches_all, mashup_names_to_search, 'Search Results: "a"');

      const matches_all_caps = (await this.db.searchUserMashups('test_user', 'A')).map((m: { name: string }) => m.name);
      arraysMatchUnordered(matches_all_caps, mashup_names_to_search, 'Search Results: "A"');

      const matches_some = (await this.db.searchUserMashups('test_user', 'ano')).map((m: { name: string }) => m.name);
      arraysMatchUnordered(matches_some, mashup_names_to_search.slice(3, 7), 'Search Results: "ano"');

      const matches_some_mixed = (await this.db.searchUserMashups('test_user', 'ANo')).map((m: { name: string }) => m.name);
      arraysMatchUnordered(matches_some_mixed, mashup_names_to_search.slice(3, 7), 'Search Results: "ANo"');

      const matches_all_limited = await this.db.searchUserMashups('test_user', 'a', 3);
      assert.equal(matches_all_limited.length, 3, 'Matches are limited to 3');

      const other_user = await this.db.searchUserMashups('unknown_user', 'a');
      assert.equal(other_user.length, 0, 'Returns no results for other user');
    });
  });
});
