const { spawnSync } = require('node:child_process')
const path = require('node:path')

const mode = process.argv[2]
const sqliteDir = path.dirname(require.resolve('better-sqlite3/package.json'))
const cli = require.resolve('prebuild-install/bin.js')
const args = [cli]

if (mode === 'electron') {
  const electronVersion = require('electron/package.json').version
  args.push('--runtime', 'electron', '--target', electronVersion)
} else if (mode !== 'node') {
  console.error('Usage: node scripts/use-native.cjs <node|electron>')
  process.exit(1)
}

const result = spawnSync(process.execPath, args, {
  cwd: sqliteDir,
  stdio: 'inherit'
})

process.exit(result.status ?? 1)
