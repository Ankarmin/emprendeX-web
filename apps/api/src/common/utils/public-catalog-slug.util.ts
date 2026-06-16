export function normalizePublicCatalogSlug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 120);

  return normalized || 'negocio';
}

export function appendPublicCatalogSlugSuffix(
  baseSlug: string,
  suffix: number,
): string {
  const suffixText = `-${suffix}`;
  const truncatedBase = baseSlug.slice(0, 120 - suffixText.length);

  return `${truncatedBase}${suffixText}`;
}
