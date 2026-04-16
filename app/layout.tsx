import type { Metadata } from 'next';

import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-app',
});

export const metadata: Metadata = {
  title: 'Insurance Policy Workflow Builder - CTS',
  description:
    'Build and manage insurance policy workflows with drag-and-drop simplicity. Create rating calculations, copywriting templates, and automated approval processes.',
  keywords: 'insurance, workflow, policy, rating, underwriting, automation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontSans.variable} suppressHydrationWarning>
      <body
        className={`${fontSans.className} min-h-screen bg-[#f1f5f9] text-slate-800 antialiased [font-feature-settings:'cv02','cv03','cv04','cv11']`}
        suppressHydrationWarning
      >

        <main className="mx-auto min-h-0 max-w-[1680px] pl-4 pr-2 sm:pl-5 sm:pr-3">{children}</main>
      </body>
    </html>
  );
}
