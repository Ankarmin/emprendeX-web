"use client";

import { useEffect, useState } from "react";
import type { PublicCatalogState } from "@/lib/public-catalog-types";
import { PublicCatalogExperience } from "./public-catalog-experience";

type PublicCatalogClientProps = {
  slug: string;
  catalog: PublicCatalogState;
};

export function PublicCatalogClient({
  slug,
  catalog,
}: PublicCatalogClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- patrón de guarda de hidratación cliente-only
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-background" />
    );
  }

  return <PublicCatalogExperience slug={slug} catalog={catalog} />;
}
