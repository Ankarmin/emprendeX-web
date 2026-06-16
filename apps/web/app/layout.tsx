import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'EmprendeX',
    template: '%s | EmprendeX',
  },
  description: 'Plataforma de gestion comercial para EmprendeX.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-stone-100 text-stone-950"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
