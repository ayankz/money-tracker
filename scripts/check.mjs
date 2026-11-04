import { spawnSync } from 'node:child_process';

const checks = {
  test: [['apps/web', 'test:ci'], ['apps/api', 'test', '--', '--runInBand']],
  'type-check': [['apps/web', 'type-check'], ['apps/api', 'type-check']],
};
const commands = checks[process.argv[2]];
if (!commands) throw new Error('Expected test or type-check');

let failed = false;
for (const [workspace, script, ...args] of commands) {
  const result = spawnSync(process.execPath, [
    process.env.npm_execpath, 'run', script, '--workspace', workspace, ...args,
  ], { stdio: 'inherit' });
  if (result.error) console.error(result.error);
  failed ||= result.status !== 0;
}
process.exitCode = failed ? 1 : 0;
