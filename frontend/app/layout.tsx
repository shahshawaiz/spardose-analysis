import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spardose Analytics',
  description: 'AI-powered financial analysis and position management',
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