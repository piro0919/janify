import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import Link from 'next/link';
import { CONTACT_FORM_URL, OPERATOR, SITE_URL } from '@/lib/site';
import './globals.css';

const notoSansJp = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Janify', template: '%s | Janify' },
  description: '旧ジャニーズのアーティストの曲を、アルバムごとに聴ける。',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="sticky top-0 z-10 bg-background/90 px-4 py-3 backdrop-blur sm:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Jani<span className="text-accent">fy</span>
          </Link>
        </header>
        <main className="flex-1 px-4 pb-16 sm:px-8">{children}</main>
        <footer className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-surface px-4 py-6 text-sm text-muted sm:px-8">
          <Link href="/terms" className="hover:text-foreground">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            プライバシーポリシー
          </Link>
          <a
            href={CONTACT_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            お問い合わせ
          </a>
          <span className="ml-auto">© {OPERATOR}</span>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
