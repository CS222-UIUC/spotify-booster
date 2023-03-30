import { assert } from 'chai';

/**
 * arraysMatchUnordered() - Checks if 2 arrays match without regard to order
 * @param actual - actual result
 * @param expected - expected result
 * @param comparator - function to compare elements, defaults to ===
 * @param array_identifier - string identifying array being tested
 */
export default function arraysMatchUnordered<T>(
  actual: Array<T>,
  expected: Array<T>,
  comparator?: (a: T, b: T) => boolean,
  array_identifier?: string
) {
  if (!comparator) comparator = (a, b) => a === b;
  if (array_identifier) array_identifier = ` ${array_identifier} `;

  assert.equal(actual.length, expected.length, `Expcted${array_identifier}arrays to have same length`);

  for (let i = 0; i < expected.length; i++) {
    let found = false;
    for (let j = 0; j < actual.length && !found; j++) {
      if (comparator(actual[j], expected[i])) {
        found = true;
        actual.splice(j, 1);
      }
    }

    assert(found, `Expected ${i}-th element of ${array_identifier}array to be in actual array`);
  }
}
