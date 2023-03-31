import { assert } from 'chai';
import fs from 'fs-extra';

/**
 * directoryContainsFiles() - checks that a directory contains all the expected files
 * @param directory - directory to check in
 * @param expected_files - files to look for
 */
export function directoryContainsFiles(directory: string, expected_files: Array<string>) {
  const files = fs.readdirSync(directory);

  // check that all expected files exist
  for (const expected of expected_files) {
    let found = false;

    for (const file of files) {
      if (file === expected) {
        found = true;
      }
    }

    assert(found, `Expect file: ${expected} to be found`);
  }
}

/**
 * directoryNotContainsFiles() - checks that a directory does not contain any of the the expected files
 * @param directory - directory to check in
 * @param unexpected_files - files to look for
 */
export function directoryNotContainsFiles(directory: string, unexpected_files: Array<string>) {
  const files = fs.readdirSync(directory);

  // check that all expected files exist
  for (const unexpected of unexpected_files) {
    let not_found = true;

    for (const file of files) {
      if (file === unexpected) {
        not_found = false;
      }
    }

    assert(not_found, `Expect file: ${unexpected} not to be found`);
  }
}
