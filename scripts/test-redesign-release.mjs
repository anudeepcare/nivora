import {readFileSync, readdirSync, rmSync, statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

// Whole-file acceptance: no name filters, ignored failures or automatic removal
// of failing tests. See verification/RELEASE_TEST_POLICY.md for the audit and
// the separate, unchanged historical suite.
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
if (args.length > 1 || (args.length && args[0] !== '--historical-all')) {
  console.error('Usage: node scripts/test-redesign-release.mjs [--historical-all]');
  process.exit(1);
}
const historical = args[0] === '--historical-all';
const files = historical
  ? readdirSync(path.join(root, 'tests')).filter(file => file.endsWith('.test.mjs')).sort().map(file => `tests/${file}`)
  : JSON.parse(readFileSync(path.join(root, 'verification/release-test-files.json'), 'utf8'));
if (!Array.isArray(files) || files.length === 0 || new Set(files).size !== files.length) {
  throw new Error('Test manifest must contain a non-empty list of unique test files.');
}
for (const file of files) {
  if (typeof file !== 'string' || !/^tests\/[A-Za-z0-9_.-]+\.test\.mjs$/.test(file)
      || !statSync(path.join(root, file)).isFile()) {
    throw new Error(`Invalid or missing test file: ${file}`);
  }
}

function run(args) {
  const result = spawnSync(process.execPath, args, {cwd: root, stdio: 'inherit'});
  if (result.error) console.error(result.error.message);
  if (result.signal) console.error(`Test command terminated by ${result.signal}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`${historical ? 'Full historical inventory (includes current acceptance)' : 'Current release acceptance'}: ${files.length} complete test files.`);
if (historical) console.log('Legacy source contracts may fail. Failures are reported and produce a nonzero exit; they are not waived by this runner.');
rmSync(path.join(root, '.engine-test'), {recursive: true, force: true});
run([require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.engine.json']);
// Some retained CLI integration tests rebuild .engine-test themselves. Serial
// execution avoids invalidating another test's imports during that rebuild.
run(['--test', '--test-concurrency=1', '--test-reporter=tap', ...files]);
