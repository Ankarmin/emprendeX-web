import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_FILE_CANDIDATES = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), 'apps/api/.env.local'),
];

function readEnvFileValue(name: string): string | null {
  for (const candidate of ENV_FILE_CANDIDATES) {
    if (!existsSync(candidate)) {
      continue;
    }

    const content = readFileSync(candidate, 'utf8');

    for (const line of content.split(/\r?\n/)) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();

      if (key !== name) {
        continue;
      }

      const value = trimmedLine.slice(separatorIndex + 1).trim();
      return value || null;
    }
  }

  return null;
}

function readConfigValue(name: string): string | null {
  return process.env[name]?.trim() || readEnvFileValue(name);
}

function readPositiveInteger(name: string, fallback: number): number {
  const rawValue = readConfigValue(name);

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

export const PUBLIC_CATALOG_READ_TTL_MINUTES = readPositiveInteger(
  'PUBLIC_CATALOG_READ_TTL_MINUTES',
  1,
);
export const PUBLIC_CATALOG_READ_LIMIT = readPositiveInteger(
  'PUBLIC_CATALOG_READ_LIMIT',
  60,
);
export const PUBLIC_CATALOG_SUBMIT_TTL_MINUTES = readPositiveInteger(
  'PUBLIC_CATALOG_SUBMIT_TTL_MINUTES',
  10,
);
export const PUBLIC_CATALOG_SUBMIT_LIMIT = readPositiveInteger(
  'PUBLIC_CATALOG_SUBMIT_LIMIT',
  5,
);
export const MAX_PUBLIC_QUOTATION_ITEMS = readPositiveInteger(
  'PUBLIC_CATALOG_MAX_ITEMS',
  25,
);
export const MAX_PUBLIC_ITEM_QUANTITY = readPositiveInteger(
  'PUBLIC_CATALOG_MAX_ITEM_QUANTITY',
  100,
);
