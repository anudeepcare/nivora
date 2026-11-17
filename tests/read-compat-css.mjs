import fs from 'node:fs';

// Read the active consolidated source, never the historical archive.
export function readCompatCss(file) {
  const source = fs.readFileSync(new URL('../app/core/legacy-panels.css', import.meta.url), 'utf8');
  const begin = `/* BEGIN legacy-source: ${file} */`;
  const end = `/* END legacy-source: ${file} */`;
  const start = source.indexOf(begin);
  const finish = source.indexOf(end, start + begin.length);
  if (start < 0 || finish < 0) throw new Error(`Missing active compatibility section: ${file}`);
  return source.slice(start + begin.length, finish);
}
