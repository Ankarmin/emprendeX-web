import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultMobileDir = resolve(rootDir, '..', 'emprendeX-mobile');
const mobileDir = process.env.EMPRENDEX_MOBILE_DIR
  ? resolve(process.env.EMPRENDEX_MOBILE_DIR)
  : defaultMobileDir;
const cliArgs = new Set(process.argv.slice(2));
const shouldClearCaches = cliArgs.has('-c') || cliArgs.has('--clear');
const isWindows = process.platform === 'win32';
const apiEnvFile = 'apps/api/.env.local';
const commands = {
  docker: isWindows ? 'docker.exe' : 'docker',
  pnpm: isWindows ? 'pnpm.cmd' : 'pnpm',
  npm: isWindows ? 'npm.cmd' : 'npm',
};

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

function runSync(command, args) {
  const normalized = normalizeCommand(command, args);

  return spawnSync(normalized.command, normalized.args, {
    cwd: rootDir,
    stdio: 'inherit',
  });
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

function isPortAvailable(port) {
  return new Promise((resolvePort) => {
    const server = net.createServer();

    server.once('error', () => resolvePort(false));
    server.once('listening', () => {
      server.close(() => resolvePort(true));
    });
    server.listen(port, '0.0.0.0');
  });
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function waitForPortToBeAvailable(port, attempts = 20, intervalMs = 250) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await isPortAvailable(port)) {
      return true;
    }

    await sleep(intervalMs);
  }

  return false;
}

function getPortProcess(port) {
  if (!isWindows) {
    return null;
  }

  const result = spawnSync('cmd.exe', ['/c', `netstat -ano -p tcp | findstr :${port}`], {
    encoding: 'utf8',
  });

  const line = result.stdout
    ?.split('\n')
    .map((value) => value.trim())
    .find((value) => value.includes('LISTENING'));
  const pid = line?.split(/\s+/).at(-1);

  if (!pid) {
    return null;
  }

  const task = spawnSync('cmd.exe', ['/c', `tasklist /FI "PID eq ${pid}"`], {
    encoding: 'utf8',
  });

  return `${pid}${task.stdout ? `\n${task.stdout.trim()}` : ''}`;
}

function getPortProcessDetails(port) {
  if (!isWindows) {
    return null;
  }

  const result = spawnSync('cmd.exe', ['/c', `netstat -ano -p tcp | findstr :${port}`], {
    encoding: 'utf8',
  });

  const line = result.stdout
    ?.split('\n')
    .map((value) => value.trim())
    .find((value) => value.includes('LISTENING'));
  const pid = Number(line?.split(/\s+/).at(-1));

  if (!pid || Number.isNaN(pid)) {
    return null;
  }

  const process = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress`,
    ],
    {
      encoding: 'utf8',
    },
  );

  const rawJson = process.stdout?.trim();

  if (!rawJson) {
    return { pid, commandLine: null, name: null };
  }

  try {
    const parsed = JSON.parse(rawJson);
    return {
      pid,
      commandLine: parsed?.CommandLine ?? null,
      name: parsed?.Name ?? null,
    };
  } catch {
    return { pid, commandLine: null, name: null };
  }
}

function isStaleRepoProcess(port, processDetails) {
  if (!isWindows || !processDetails?.commandLine) {
    return false;
  }

  const normalizedRootDir = rootDir.toLowerCase();
  const normalizedMobileDir = mobileDir.toLowerCase();
  const normalizedCommandLine = processDetails.commandLine.toLowerCase();

  if (
    port === 3001 &&
    normalizedCommandLine.includes(normalizedRootDir) &&
    normalizedCommandLine.includes('next\\dist\\server\\lib\\start-server.js')
  ) {
    return true;
  }

  return port === 8081 && normalizedCommandLine.includes(normalizedMobileDir);
}

function stopProcessById(pid) {
  if (!pid) {
    return;
  }

  if (isWindows) {
    spawnSync('cmd.exe', ['/c', `taskkill /PID ${pid} /T /F`], {
      stdio: 'ignore',
    });
    return;
  }

  process.kill(pid, 'SIGINT');
}

async function releaseKnownDevPorts(ports) {
  for (const port of ports) {
    const processDetails = getPortProcessDetails(port);

    if (!processDetails || !isStaleRepoProcess(port, processDetails)) {
      continue;
    }

    console.log(
      `Stopping stale local process on port ${port} (PID ${processDetails.pid}).`,
    );
    stopProcessById(processDetails.pid);

    if (!(await waitForPortToBeAvailable(port))) {
      console.log(
        `Port ${port} is still busy after stopping PID ${processDetails.pid}.`,
      );
    }
  }
}

async function assertPortsAvailable(ports) {
  const busyPorts = [];

  for (const port of ports) {
    if (!(await isPortAvailable(port))) {
      busyPorts.push(port);
    }
  }

  if (busyPorts.length === 0) {
    return;
  }

  for (const port of busyPorts) {
    console.error(`Port ${port} is already in use.`);
    const processInfo = getPortProcess(port);

    if (processInfo) {
      console.error(processInfo);
    }
  }

  console.error('Close the conflicting process or change the local ports before running pnpm dev.');
  process.exit(1);
}

function stopProcess(child) {
  if (!child || child.killed) {
    return;
  }

  if (isWindows && child.pid) {
    stopProcessById(child.pid);
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

  const normalized = normalizeCommand(commands.docker, [
    'compose',
    '--env-file',
    apiEnvFile,
    'down',
  ]);
  const down = spawn(normalized.command, normalized.args, {
    cwd: rootDir,
    stdio: 'inherit',
  });

  down.on('exit', () => {
    process.exit(exitCode);
  });
}

process.on('SIGINT', () => {
  void shutdown(0);
});

process.on('SIGTERM', () => {
  void shutdown(0);
});

clearConsole();
console.log('Preparing EmprendeX local development stack...');
runSync(commands.docker, ['compose', '--env-file', apiEnvFile, 'down', '--remove-orphans']);
removePathIfExists(resolve(rootDir, 'apps/web/.next'), 'Next.js cache');

if (shouldClearCaches) {
  console.log('Deep clean requested with -c/--clear.');
  removePathIfExists(resolve(mobileDir, '.expo'), 'Expo cache');
  removePathIfExists(resolve(mobileDir, 'node_modules/.cache'), 'mobile node_modules cache');
  removePathIfExists(resolve(rootDir, 'node_modules/.cache'), 'workspace node_modules cache');
  clearMetroCaches();
}

await releaseKnownDevPorts([3001, 8081]);
await assertPortsAvailable([3000, 3001, 5433, 8081]);

console.log('EmprendeX local development stack');
console.log('API Docker: http://localhost:3000/api/v1');
console.log('Web local:  http://localhost:3001');
console.log(`Mobile:     ${mobileDir}`);
console.log('Press Ctrl+C to stop all services and docker containers.');

run('api', commands.docker, [
  'compose',
  '--env-file',
  apiEnvFile,
  'up',
  '--build',
  'api',
]);

run('web', commands.pnpm, ['--filter', './apps/web', 'dev:share']);

if (existsSync(resolve(mobileDir, 'package.json'))) {
  console.log('Mobile QR: Expo output will be shown without prefix below.');
  const mobileArgs = ['run', 'start'];

  if (shouldClearCaches) {
    mobileArgs.push('--', '--clear');
  }

  run('mobile', commands.npm, mobileArgs, mobileDir, {
    passthroughOutput: true,
  });
} else {
  console.warn(
    `[mobile] package.json not found at ${mobileDir}. Set EMPRENDEX_MOBILE_DIR to override.`,
  );
}
