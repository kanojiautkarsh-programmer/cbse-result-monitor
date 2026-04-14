import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CBSE Class 10 Result Updates 2026',
  description: 'Real-time monitoring of CBSE Class 10 results from official sources and Reddit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
