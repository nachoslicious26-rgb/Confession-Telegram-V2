import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confession Web App',
  description: 'Platform Luahan Hati Anonim',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
