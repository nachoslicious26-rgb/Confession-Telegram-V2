import type { Metadata } from 'next';
import './globals.css'; // 👈 WAJIB: Memanggil Tailwind CSS

export const metadata: Metadata = {
  title: 'Anonymous Confession | NGL Style',
  description: 'Hantar luahan hati secara anonim',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms" className="dark">
      <body className="bg-black text-slate-100 antialiased selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
