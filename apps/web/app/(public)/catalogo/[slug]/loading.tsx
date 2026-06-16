import { PublicShell } from '@/components/public-catalog/public-shell';

export default function LoadingCatalogPage() {
  return (
    <PublicShell businessName="Catálogo">
      <div className="min-h-screen animate-pulse bg-background pb-10">
        <header className="sticky top-0 z-30 bg-primary shadow-sm">
          <div className="px-4 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded-full bg-primary-foreground/20" />
              <div className="h-10 w-10 rounded-full bg-primary-foreground/15" />
            </div>
            <div className="mt-3 h-10 rounded-md bg-background" />
            <div className="mt-3 flex gap-2">
              <div className="h-7 w-16 rounded-full bg-background" />
              <div className="h-7 w-20 rounded-full bg-primary-foreground/15" />
              <div className="h-7 w-20 rounded-full bg-primary-foreground/15" />
            </div>
          </div>
        </header>

        <div className="sticky top-[124px] z-20 border-b bg-background/95 px-4 py-2.5">
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
        </div>

        <main className="px-3 pt-3">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border bg-card">
                <div className="aspect-square bg-muted" />
                <div className="space-y-1.5 p-1.5">
                  <div className="h-3 w-full rounded-full bg-muted" />
                  <div className="h-3 w-2/3 rounded-full bg-muted" />
                  <div className="mt-2 h-4 w-16 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </PublicShell>
  );
}
