import { copyFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultMobileDir = resolve(rootDir, '..', 'emprendeX-mobile');
const mobileDir = process.env.EMPRENDEX_MOBILE_DIR
  ? resolve(process.env.EMPRENDEX_MOBILE_DIR)
  : defaultMobileDir;
const isWindows = process.platform === 'win32';
const cliArgs = new Set(process.argv.slice(2));
const shouldClearCaches = cliArgs.has('-c') || cliArgs.has('--clear');
const npm = isWindows ? 'npm.cmd' : 'npm';

const processes = [];
let isShuttingDown = false;

function normalizeCommand(command, args) {
  if (!isWindows || !command.endsWith('.cmd')) {
    return { command, args };
  }

  return {
    command: 'cmd.exe',
    args: ['/d', '/s', '/c', command, ...args],
  };
}

function run(label, command, args, cwd = rootDir, options = {}) {
  const normalized = normalizeCommand(command, args);
  let child;
  const usePassthroughOutput = options.passthroughOutput === true;

  try {
    child = spawn(normalized.command, normalized.args, {
      cwd,
      stdio: usePassthroughOutput
        ? 'inherit'
        : ['inherit', 'pipe', 'pipe'],
    });
  } catch (error) {
    console.error(`[${label}] failed to start ${command}:`, error);
    void shutdown(1);
    return null;
  }

  if (!usePassthroughOutput) {
    child.stdout.on('data', (chunk) => {
      process.stdout.write(`[${label}] ${chunk}`);
    });

    child.stderr.on('data', (chunk) => {
      process.stderr.write(`[${label}] ${chunk}`);
    });
  }

  child.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
      void shutdown(code ?? 1);
    }
  });

  processes.push(child);
  return child;
}

function clearConsole() {
  if (process.stdout.isTTY) {
    process.stdout.write('\x1Bc');
  }
}

function removePathIfExists(targetPath, label) {
  if (!existsSync(targetPath)) {
    return;
  }

  rmSync(targetPath, { recursive: true, force: true });
  console.log(`Cleared ${label}: ${targetPath}`);
}

function clearMetroCaches() {
  if (!isWindows) {
    return;
  }

  removePathIfExists(
    resolve(process.env.LOCALAPPDATA ?? '', 'Temp', 'metro-cache'),
    'Metro cache',
  );
}

function stopProcess(child) {
  if (!child || child.killed) {
    return;
  }

  if (isWindows && child.pid) {
    spawnSync('cmd.exe', ['/c', `taskkill /PID ${child.pid} /T /F`], {
      stdio: 'ignore',
    });
    return;
  }

  child.kill('SIGINT');
}

async function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  for (const child of processes) {
    stopProcess(child);
  }

  process.exit(exitCode);
}

process.on('SIGINT', () => {
  void shutdown(0);
});

process.on('SIGTERM', () => {
  void shutdown(0);
});

clearConsole();
console.log('Preparing EmprendeX Railway development stack...');

const mobileEnvRailway = resolve(mobileDir, '.env.railway.example');
const mobileEnvLocal = resolve(mobileDir, '.env.local');

if (!existsSync(mobileEnvRailway)) {
  console.error(
    `[error] mobile/.env.railway.example not found. Create it with your Railway API URL first:\n` +
    `  EXPO_PUBLIC_API_RAILWAY_BASE_URL=https://api-production-xxxx.up.railway.app/api/v1`,
  );
  process.exit(1);
}

copyFileSync(mobileEnvRailway, mobileEnvLocal);
console.log(`[env] Copied mobile/.env.railway.example -> mobile/.env.local`);

if (shouldClearCaches) {
  console.log('Deep clean requested with -c/--clear.');
  removePathIfExists(resolve(mobileDir, '.expo'), 'Expo cache');
  removePathIfExists(resolve(mobileDir, 'node_modules/.cache'), 'mobile node_modules cache');
  removePathIfExists(resolve(rootDir, 'node_modules/.cache'), 'workspace node_modules cache');
  clearMetroCaches();
}

console.log('EmprendeX Railway development stack');
console.log(`Mobile: ${mobileDir}  ->  Railway API`);
console.log('Press Ctrl+C to stop.');

if (existsSync(resolve(mobileDir, 'package.json'))) {
  console.log('Mobile QR: Expo output will be shown without prefix below.');
  const mobileArgs = ['run', 'start'];

  if (shouldClearCaches) {
    mobileArgs.push('--', '--clear');
  }

  run('mobile', npm, mobileArgs, mobileDir, {
    passthroughOutput: true,
  });
} else {
  console.warn(
    `[mobile] package.json not found at ${mobileDir}. Set EMPRENDEX_MOBILE_DIR to override.`,
  );
}
