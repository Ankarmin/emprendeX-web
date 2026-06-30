import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultMobileDir = resolve(rootDir, '..', 'emprendeX-mobile');
const mobileDir = process.env.EMPRENDEX_MOBILE_DIR
  ? resolve(process.env.EMPRENDEX_MOBILE_DIR)
  : defaultMobileDir;
const mobilePackageJsonPath = resolve(mobileDir, 'package.json');
const isCi = process.env.CI === 'true' || process.env.VERCEL === '1';
const skipMobileInstall =
  process.env.SKIP_MOBILE_INSTALL === '1' || isCi;
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function normalizeCommand(command, args) {
  if (process.platform !== 'win32' || !command.endsWith('.cmd')) {
    return { command, args };
  }

  return {
    command: 'cmd.exe',
    args: ['/d', '/s', '/c', command, ...args],
  };
}

if (skipMobileInstall) {
  console.log('[mobile-install] skipped by SKIP_MOBILE_INSTALL=1');
  process.exit(0);
}

if (!existsSync(mobilePackageJsonPath)) {
  console.log(
    `[mobile-install] skipped because package.json was not found at ${mobilePackageJsonPath}`,
  );
  process.exit(0);
}

console.log(`[mobile-install] running npm install in ${mobileDir}`);

const normalized = normalizeCommand(npmCommand, ['install']);

const installResult = spawnSync(normalized.command, normalized.args, {
  cwd: mobileDir,
  stdio: 'inherit',
  env: process.env,
});

process.exit(installResult.status ?? 1);
