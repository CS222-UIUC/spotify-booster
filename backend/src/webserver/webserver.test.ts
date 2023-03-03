import { assert } from 'chai';
import request from 'supertest';
import fs from 'fs-extra';
import path from 'path';

const TEMP_FILE_DIRECTORY = path.join(__dirname, 'test_webserver');

process.env.WEB_PORT = '8888';
process.env.WEB_STATIC_PATH = path.join(TEMP_FILE_DIRECTORY, 'static');
process.env.WEB_INDEX_PATH = path.join(TEMP_FILE_DIRECTORY, 'index.html');

// import after setting environment variables
import StartWebServer from './webserver';

const test_index_file = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatsible" content="ie=edge">
    <title>HTML 5 Boilerplate</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
	<script src="index.js"></script>
  </body>
</html>
`;

const test_static_file0 = "console.log('Hello World');";
const test_static_file1 = "console.log('Hello, World!');";

// ensure empty temporary directory exists before running tests
before(async () => {
  try {
    fs.mkdirSync(TEMP_FILE_DIRECTORY, { recursive: true });
    fs.emptyDirSync(TEMP_FILE_DIRECTORY);

    fs.writeFileSync(process.env.WEB_INDEX_PATH, test_index_file);

    fs.mkdirSync(process.env.WEB_STATIC_PATH, { recursive: true });
    fs.writeFileSync(
      path.join(process.env.WEB_STATIC_PATH, 'test_static0.js'),
      test_static_file0
    );

    fs.mkdirSync(path.join(process.env.WEB_STATIC_PATH, 'subfolder'));
    fs.writeFileSync(
      path.join(process.env.WEB_STATIC_PATH, 'subfolder', 'test_static1.js'),
      test_static_file1
    );
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

describe('Basic Web Server', () => {
  it('returns index page at /index', async () => {
    const server = StartWebServer();

    const req = request('http://localhost:8888');
    const response = await req.get('/index');

    assert(
      response.text === test_index_file,
      'Responds with correct index file'
    );

    return new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });

  it('returns static content at /test_static0.js', async () => {
    const server = StartWebServer();

    const req = request('http://localhost:8888');
    const response = await req.get('/test_static0.js');

    assert(
      response.text === test_static_file0,
      'Responds with correct static file'
    );

    return new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });

  it('returns static content in a subfolder at /subfolder/test_static1.js', async () => {
    const server = StartWebServer();

    const req = request('http://localhost:8888');
    const response = await req.get('/subfolder/test_static1.js');

    assert(
      response.text === test_static_file1,
      'Responds with correct static file'
    );

    return new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });
});
