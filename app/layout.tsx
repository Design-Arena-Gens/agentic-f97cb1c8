import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Nifty Intraday Agent',
  description: 'Analyze NIFTY 50 intraday patterns and big moves',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
