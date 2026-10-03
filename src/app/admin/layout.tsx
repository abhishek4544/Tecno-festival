import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} admin-scope flex min-h-screen flex-col`}
    >
      {children}
    </div>
  );
}
