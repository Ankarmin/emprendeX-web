import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicCatalogClient } from '@/components/public-catalog/public-catalog-client';
import { PublicShell } from '@/components/public-catalog/public-shell';
import {
  fetchPublicCatalog,
  isPublicCatalogApiError,
} from '@/lib/public-catalog-api';

type CatalogPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: 'Catálogo público',
};

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { slug } = await params;
  const catalog = await loadCatalogOrThrow(slug);

  return (
    <PublicShell
      businessName={catalog.business.name}
      colorPaletteId={catalog.business.colorPaletteId}
    >
      <PublicCatalogClient slug={slug} catalog={catalog} />
    </PublicShell>
  );
}

async function loadCatalogOrThrow(slug: string) {
  try {
    return await fetchPublicCatalog(slug);
  } catch (error) {
    if (isPublicCatalogApiError(error) && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
