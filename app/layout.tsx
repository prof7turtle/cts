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
    <html lang="en" className={fontSans.variable}>
      <body
        className={`${fontSans.className} min-h-screen bg-[#f1f5f9] text-slate-800 antialiased [font-feature-settings:'cv02','cv03','cv04','cv11']`}
      >
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md">
          <div className="mx-auto flex h-[3.75rem] max-w-[1680px] items-center gap-4 px-5 sm:px-8">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-lg font-bold tracking-tight text-sky-950 shadow-sm ring-1 ring-sky-200/80"
              aria-hidden
            >
              C
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 leading-none sm:flex-row sm:items-baseline sm:gap-3">
              <span className="truncate text-base font-semibold tracking-tight text-slate-900">
                Cogitate
              </span>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                ·
              </span>
              <span className="truncate text-sm font-medium tracking-wide text-slate-500">
                Workflow Studio
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto min-h-0 max-w-[1680px]">{children}</main>
      </body>
    </html>
  );
}
