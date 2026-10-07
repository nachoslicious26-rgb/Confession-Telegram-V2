import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="ms">
      <head>
        {/* 🚀 Mengimpor Tailwind CSS via CDN secara langsung */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-[#030008] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
