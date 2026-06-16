import { TransformFnParams } from 'class-transformer';

export const HTTPS_URL_REGEX = /^https:\/\/[^\s<>'"]+$/i;

export function transformTrimmedNullableString({
  value,
}: TransformFnParams): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}
