export const SKIP_ALL_THROTTLERS = {
  publicCatalogRead: true,
  publicCatalogSubmit: true,
} as const;

export const SKIP_PUBLIC_CATALOG_READ_THROTTLER = {
  publicCatalogRead: true,
} as const;

export const SKIP_PUBLIC_CATALOG_SUBMIT_THROTTLER = {
  publicCatalogSubmit: true,
} as const;
