import fs from 'fs-extra';
import path from 'path';

export const LOG_FILE_DIRECTORY = path.join(__dirname, 'test_logs');

/**
 * formatDate() - Formats UNIX timestamp in YYYY-MM-DD format
 * @param date - unix timestamp in ms
 * @returns - date string
 */
export function formatDate(date: number) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return `${year}-${month}-${day}`;
}

type LogProperties = {
  level: string;
  message: string;
  timestamp?: string;
  stack?: string;
};

type ExpectedLogProperties = {
  level: string;
  message: string;
  stack?: string;
};

/**
 * fetchLogs() - Fetches logs with given logger name
 * @param logger_name - name passed to logger on creation
 */
export function fetchLogs(logger_name: string): { debug: Array<LogProperties>; info: Array<LogProperties> } {
  const date_string = formatDate(Date.now());
  const debug_logs = fs
    .readFileSync(path.join(LOG_FILE_DIRECTORY, `${logger_name}-Debug-${date_string}.log`), 'utf-8')
    .split('\r');
  const info_logs = fs
    .readFileSync(path.join(LOG_FILE_DIRECTORY, `${logger_name}-Info-${date_string}.log`), 'utf-8')
    .split('\r');

  const debug: Array<LogProperties> = [];
  const info: Array<LogProperties> = [];

  for (let i = 0; i < debug_logs.length; i++) {
    // ignore empty strings (\n counts as 1)
    if (debug_logs[i].length < 2) continue;
    debug.push(JSON.parse(debug_logs[i]));
  }

  for (let i = 0; i < info_logs.length; i++) {
    // ignore empty strings (\n counts as 1)
    if (info_logs[i].length < 2) continue;
    info.push(JSON.parse(info_logs[i]));
  }

  return { debug, info };
}

/**
 * matchLogs() - comparse 2 logs, returns true if they match
 */
export function matchLogs(a: LogProperties, e: LogProperties) {
  const timestamp_match = a.timestamp === e.timestamp;
  const message_match = a.message.startsWith(e.message);
  const stack_match = e.stack ? a.stack.startsWith('Error: ' + e.stack) : true;
  return a.level === e.level && timestamp_match && message_match && stack_match;
}

/**
 * filterDebug() - creates a new array of expected output without debug logs
 * @param expected - array of log properties to remove debug messages from
 * @returns - array of log properties with debug messages removed
 */
export function filterDebug(expected: Array<ExpectedLogProperties>): Array<ExpectedLogProperties> {
  const new_array: Array<LogProperties> = [];
  for (let i = 0; i < expected.length; i++) {
    if (expected[i].level !== 'debug') {
      new_array.push(expected[i]);
    }
  }

  return new_array;
}
