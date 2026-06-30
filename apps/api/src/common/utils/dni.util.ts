import { TransformFnParams } from 'class-transformer';
import { ValueTransformer } from 'typeorm';

export const DNI_REGEX = /^[0-9]{8}$/;
export const DNI_VALIDATION_MESSAGE = 'El DNI debe tener exactamente 8 digitos';

export function normalizeDni(value: string): string {
  return value.trim();
}

export function transformTrimmedString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export const trimmedStringTransformer: ValueTransformer = {
  to: (value: string | null | undefined) =>
    typeof value === 'string' ? value.trim() : value,
  from: (value: string | null | undefined) =>
    typeof value === 'string' ? value.trim() : value,
};
