import fs from 'fs-extra';
import path from 'path';

export const test_index_file = `
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

export const test_static_file0 = "console.log('Hello World');";
export const test_static_file1 = "console.log('Hello, World!');";

/**
 * createIndexFile() - writes a test index.html file to disk
 * @param location - location to write index.html file at
 */
export function createIndexFile(location: string) {
  fs.writeFileSync(location, test_index_file);
}

/**
 * createStaticFiles() - writes static files to disk
 * Created structure:
 * directory/
 * |- subfolder/
 * |  |- test_static1.js
 * |
 * |- test_static0.js
 * @param directory - directory to write files in
 */
export function createStaticFiles(directory: string) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'test_static0.js'), test_static_file0);

  fs.mkdirSync(path.join(directory, 'subfolder'));
  fs.writeFileSync(path.join(directory, 'subfolder', 'test_static1.js'), test_static_file1);
}
