import type { ReactNode } from 'react';
import { getPublicCatalogPaletteStyles } from '@/lib/public-catalog-theme';
import type { PublicCatalogState } from '@/lib/public-catalog-types';

type PublicShellProps = {
  businessName?: string;
  colorPaletteId?: PublicCatalogState['business']['colorPaletteId'];
  children: ReactNode;
};

export function PublicShell({ children, colorPaletteId }: PublicShellProps) {
  return (
    <main
      className="min-h-screen bg-background text-foreground"
      style={colorPaletteId ? getPublicCatalogPaletteStyles(colorPaletteId) : undefined}
      suppressHydrationWarning
    >
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_45%)]" suppressHydrationWarning>
        {children}
      </div>
    </main>
  );
}
