const { spawnSync } = require('node:child_process')
const electron = require('electron')

const extraArgs = process.argv.slice(2)
const result = spawnSync(electron, ['./node_modules/vitest/vitest.mjs', 'run', ...extraArgs], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  stdio: 'inherit'
})

process.exit(result.status ?? 0)
