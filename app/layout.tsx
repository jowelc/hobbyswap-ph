import type { Metadata } from 'next';
import './globals.css';
import AuthSessionProvider from '@/components/AuthSessionProvider';

export const metadata: Metadata = {
  title: 'HobbySwap PH — Trade hobbies. Build trust.',
  description:
    "HobbySwap PH is the Philippines' premier collectible trading platform. Trade sports cards, Pokemon, watches, sneakers, and more with verified collectors.",
  keywords: 'trading cards Philippines, Pokemon cards PH, basketball cards trade, collectibles swap, HobbySwap PH',
  icons: {
    icon: '/logo-icon.png',
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
