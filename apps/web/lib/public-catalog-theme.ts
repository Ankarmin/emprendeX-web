import type { CSSProperties } from 'react';
import type { PublicCatalogState } from './public-catalog-types';

type PublicCatalogPaletteId = PublicCatalogState['business']['colorPaletteId'];

type PublicCatalogPalette = {
  primary: string;
  primaryForeground: string;
  primarySoft: string;
  primaryText: string;
  primaryBorder: string;
};

const PUBLIC_CATALOG_PALETTES: Record<PublicCatalogPaletteId, PublicCatalogPalette> = {
  violet: {
    primary: '#7c3aed',
    primaryForeground: '#ffffff',
    primarySoft: '#f5f3ff',
    primaryText: '#6d28d9',
    primaryBorder: '#ddd6fe',
  },
  ocean: {
    primary: '#0284c7',
    primaryForeground: '#ffffff',
    primarySoft: '#e0f2fe',
    primaryText: '#0369a1',
    primaryBorder: '#bae6fd',
  },
  forest: {
    primary: '#059669',
    primaryForeground: '#ffffff',
    primarySoft: '#d1fae5',
    primaryText: '#047857',
    primaryBorder: '#a7f3d0',
  },
  ember: {
    primary: '#d97706',
    primaryForeground: '#ffffff',
    primarySoft: '#fef3c7',
    primaryText: '#b45309',
    primaryBorder: '#fde68a',
  },
  rose: {
    primary: '#e11d48',
    primaryForeground: '#ffffff',
    primarySoft: '#ffe4e6',
    primaryText: '#be123c',
    primaryBorder: '#fecdd3',
  },
  slate: {
    primary: '#475569',
    primaryForeground: '#ffffff',
    primarySoft: '#f1f5f9',
    primaryText: '#334155',
    primaryBorder: '#cbd5e1',
  },
  graphite: {
    primary: '#3f3f46',
    primaryForeground: '#ffffff',
    primarySoft: '#f4f4f5',
    primaryText: '#27272a',
    primaryBorder: '#d4d4d8',
  },
  sand: {
    primary: '#a16207',
    primaryForeground: '#ffffff',
    primarySoft: '#fef3c7',
    primaryText: '#854d0e',
    primaryBorder: '#fde68a',
  },
};

export function getPublicCatalogPaletteStyles(
  colorPaletteId: PublicCatalogPaletteId,
): CSSProperties {
  const palette = PUBLIC_CATALOG_PALETTES[colorPaletteId];

  return {
    ['--background' as string]: '#ffffff',
    ['--foreground' as string]: '#0f172a',
    ['--card' as string]: '#ffffff',
    ['--card-foreground' as string]: '#0f172a',
    ['--primary' as string]: palette.primary,
    ['--primary-foreground' as string]: palette.primaryForeground,
    ['--accent' as string]: palette.primarySoft,
    ['--accent-foreground' as string]: palette.primaryText,
    ['--secondary' as string]: palette.primarySoft,
    ['--secondary-foreground' as string]: palette.primaryText,
    ['--muted' as string]: palette.primarySoft,
    ['--muted-foreground' as string]: '#64748b',
    ['--border' as string]: palette.primaryBorder,
    ['--input' as string]: palette.primaryBorder,
    ['--ring' as string]: palette.primaryBorder,
  };
}
