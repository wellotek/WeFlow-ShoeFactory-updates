const { spawnSync } = require('child_process')
const path = require('path')
const asarPath = path.resolve(__dirname, '../release/win-unpacked/resources/app.asar')
const electronExe = path.resolve(__dirname, '../release/win-unpacked/WeFlow-ShoeFactory.exe')

console.log('Testing packaged application at:', electronExe)
console.log('Target app.asar:', asarPath)

const testCode = `
const fs = require('fs');
const path = require('path');

console.log('[TEST 1] Testing dijkstrajs resolution...');
const dijkstra = require('dijkstrajs');
console.log('[PASS] dijkstrajs loaded successfully:', typeof dijkstra.find_path === 'function');

console.log('[TEST 2] Testing qrcode module and SVG generation...');
const QRCode = require('qrcode');

async function main() {
  const svg = await QRCode.toString('WEFLOW-SHOEFACTORY-PROD-TEST', { type: 'svg' });
  console.log('[PASS] qrcode generated SVG! Length:', svg.length, 'Contains <svg>:', svg.includes('<svg>'));

  console.log('[TEST 3] Testing jszip loading and compression...');
  const JSZip = require('jszip');
  const zip = new JSZip();
  zip.file('test.txt', 'WeFlow ShoeFactory');
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  console.log('[PASS] JSZip compressed buffer successfully, size:', buf.length);

  console.log('[TEST 4] Testing electron-updater module loading...');
  const updaterModule = require('electron-updater');
  console.log('[PASS] electron-updater module exports loaded:', typeof updaterModule.NsisUpdater === 'function');

  console.log('[TEST 5] Testing better-sqlite3 loading...');
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.prepare('CREATE TABLE test (id INT, name TEXT)').run();
  db.prepare("INSERT INTO test VALUES (1, 'ShoeFactory')").run();
  const row = db.prepare('SELECT * FROM test WHERE id = 1').get();
  console.log('[PASS] better-sqlite3 in-memory query result:', JSON.stringify(row));
  db.close();

  console.log('[ALL TESTS COMPLETED SUCCESSFULLY]');
}

main().catch(err => {
  console.error('[TEST SUITE FAILED]', err);
  process.exit(1);
});
`

const result = spawnSync(electronExe, ['-e', testCode], {
  cwd: path.resolve(__dirname, '../release/win-unpacked'),
  env: {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    NODE_PATH: path.join(asarPath, 'node_modules')
  },
  encoding: 'utf8'
})

console.log('--- PACKAGED APP EXECUTION STDOUT ---')
console.log(result.stdout)
if (result.stderr) {
  console.error('--- PACKAGED APP EXECUTION STDERR ---')
  console.error(result.stderr)
}
console.log('--- EXIT STATUS ---', result.status)

if (result.status !== 0) {
  process.exit(result.status || 1)
}
