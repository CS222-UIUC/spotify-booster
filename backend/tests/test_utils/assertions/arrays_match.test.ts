import { assert } from 'chai';

/**
 * arraysMatchUnordered() - Checks if 2 arrays match without regard to order
 * @param actual - actual result
 * @param expected - expected result
 * @param comparator - function to compare elements, where act is the actual value and exp is the expected value, defaults to ===
 * @param array_identifier - string identifying array being tested
 */
export function arraysMatchUnordered<T>(
  actual: Array<T>,
  expected: Array<T>,
  comparator?: (act: T, exp: T) => boolean,
  array_identifier?: string
) {
  if (!comparator) comparator = (a, b) => a === b;
  if (array_identifier) array_identifier = ` ${array_identifier} `;

  assert.equal(actual.length, expected.length, `Expected${array_identifier}arrays to have same length`);

  for (let i = 0; i < expected.length; i++) {
    let found = false;
    for (let j = 0; j < actual.length && !found; j++) {
      if (comparator(actual[j], expected[i])) {
        found = true;
        actual.splice(j, 1);
      }
    }

    assert(found, `Expected ${i}-th element of${array_identifier}array to be in actual array`);
  }
}

/**
 * arraysMatchOrdered() - Checks if 2 arrays match in order
 * @param actual - actual result
 * @param expected - expected result
 * @param comparator - function to compare elements, where act is the actual value and exp is the expected value, defaults to ===
 * @param array_identifier - string identifying array being tested
 */
export function arraysMatchOrdered<T>(
  actual: Array<T>,
  expected: Array<T>,
  comparator?: (act: T, exp: T) => boolean,
  array_identifier?: string
) {
  if (!comparator) comparator = (a, b) => a === b;
  if (array_identifier) array_identifier = ` ${array_identifier} `;

  assert.equal(actual.length, expected.length, `Expected${array_identifier}arrays to have same length`);

  for (let i = 0; i < expected.length; i++) {
    assert(comparator(actual[i], expected[i]), `Expected ${i}-th element of ${array_identifier}array to match`);
  }
}
