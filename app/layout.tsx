import type { Metadata } from 'next';
import Image from 'next/image';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import CogitateLogo from './CogitateLogo.jpg';

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
    <html lang="en" className={fontSans.variable}>
      <body
        className={`${fontSans.className} min-h-screen bg-[#f1f5f9] text-slate-800 antialiased [font-feature-settings:'cv02','cv03','cv04','cv11']`}
      >
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md">
          <div className="mx-auto flex h-[3.75rem] max-w-[1680px] items-center gap-4 pl-10 pr-6 sm:pl-12 sm:pr-10">
            <div className="relative inline-flex h-11 w-[156px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200/80 bg-white px-4 py-2 shadow-sm transition-all duration-200">
              <Image
                src={CogitateLogo}
                alt="Cogitate"
                fill
                className="object-contain object-left pl-2 pr-4 py-1.5"
                priority
              />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 leading-none sm:flex-row sm:items-baseline sm:gap-3">
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                /
              </span>
              <span className="truncate text-sm font-medium tracking-wide text-slate-500">
                Workflow Studio
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto min-h-0 max-w-[1680px] pl-4 pr-2 sm:pl-5 sm:pr-3">{children}</main>
      </body>
    </html>
  );
}
