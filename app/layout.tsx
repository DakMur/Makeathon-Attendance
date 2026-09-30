import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Makeathon Attendance | Real-Time Admin Grid',
  description: 'High-performance real-time 3-day multi-admin attendance spreadsheet for Makeathon (Oct 7, 8, 9).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-zinc-900 dark:bg-[#09090b] dark:text-[#fafafa] selection:bg-[#2563eb] selection:text-white transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
