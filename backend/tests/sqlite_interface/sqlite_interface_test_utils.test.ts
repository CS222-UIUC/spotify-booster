import { RunResult } from 'sqlite3';
import SQLiteInterface from '../../src/sqlite_interface/sqlite_interface';

export class SQLiteInterfaceTester extends SQLiteInterface {
  async dbRun(cmd: string, params: object): Promise<RunResult> {
    return super.dbRun(cmd, params);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async dbAll(cmd: string, params: object): Promise<Array<any>> {
    return super.dbAll(cmd, params);
  }
}
