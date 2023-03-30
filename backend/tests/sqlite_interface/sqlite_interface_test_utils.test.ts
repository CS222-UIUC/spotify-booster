import { RunResult } from 'sqlite3';
import SQLiteInterface from '../../src/sqlite_interface/sqlite_interface';

/**
 * SQLiteInterfaceTester() - Simple wrapper for SQLiteInterface to facilitate testing
 */
export class SQLiteInterfaceTester extends SQLiteInterface {
  async dbRun(cmd: string, params: object): Promise<RunResult> {
    return super.dbRun(cmd, params);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async dbAll(cmd: string, params: object): Promise<Array<any>> {
    return super.dbAll(cmd, params);
  }
}

/**
 * matchTestRow() - Compares two sql rows and returns true if they match
 * @param a - A row object
 * @param b - Another row object
 * @returns - if rows match or not
 */
export function matchTestRow(a: { col1: string; col2: string }, b: { col1: string; col2: string }): boolean {
  return a.col1 === b.col1 && a.col2 === b.col2;
}
