import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Insurance Policy Workflow Builder - CTS',
  description: 'Build and manage insurance policy workflows with drag-and-drop simplicity. Create rating calculations, copywriting templates, and automated approval processes.',
  keywords: 'insurance, workflow, policy, rating, underwriting, automation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        {children}
      </body>
    </html>
  );
}
