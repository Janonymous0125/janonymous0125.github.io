import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const output = path.resolve(root, 'out');

if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'out') {
  throw new Error('Refusing to prepare output outside this project.');
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const publicDirectories = ['cert', 'files', 'fonts', 'icons', 'images', 'music', 'notes', 'posts', 'videos'];
const publicExtensions = new Set(['.html', '.css', '.js', '.ico', '.xml', '.txt']);

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && publicExtensions.has(path.extname(entry.name).toLowerCase())) {
    fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name));
  }
}

for (const directory of publicDirectories) {
  const source = path.join(root, directory);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(output, directory), { recursive: true });
}

fs.mkdirSync(path.join(output, 'scripts'), { recursive: true });
fs.copyFileSync(path.join(root, 'scripts', 'SuperAdmin.ps1'), path.join(output, 'scripts', 'SuperAdmin.ps1'));

console.log('Prepared portfolio output in out/.');
