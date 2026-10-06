import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import Link from 'next/link';
import { Suspense } from 'react';
import { Header } from '@/components/header';
import { Logo, MobileTabs, Sidebar } from '@/components/nav';
import { PlayerProvider } from '@/components/player/player-provider';
import { Progress } from '@/components/progress';
import { SearchBox } from '@/components/search-box';
import { themeScript } from '@/components/theme/theme-script';
import { ThemeWatcher } from '@/components/theme/theme-watcher';
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
  twitter: { card: 'summary_large_image' },
};

// スマホのブラウザの枠の色。端末の設定に合わせて、地の色とそろえる
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0e0d12' },
    { media: '(prefers-color-scheme: light)', color: '#f8f7fb' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // data-theme はページを描く前に themeScript が付けるので、サーバーの出力と食い違ってよい
    <html
      lang="ja"
      className={`${notoSansJp.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          ページを描く前に data-theme を付ける。next/script の beforeInteractive は Next.js の仕組みが
          動き出してから実行されるので、開いた瞬間に色がちらつく。そのため素の script を置く。
          開発中にレイアウトを描き直すと React が script タグについて警告を出すが、本番には関係しない
        */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full font-sans">
        <Progress>
          <PlayerProvider>
            {/*
              画面の上部の色の背景（ambient.tsx）が、ヘッダーの下とサイドバーの後ろまで回り込むよう、
              画面全体のこの枠を基準にする
            */}
            <div className="relative isolate flex min-h-dvh">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Header>
                  <div className="md:hidden">
                    <Logo />
                  </div>
                  {/* 検索欄は URL の語を読むので、静的に書き出す画面では Suspense で包む */}
                  <Suspense fallback={<div className="h-10 w-full max-w-xl" />}>
                    <SearchBox />
                  </Suspense>
                </Header>
                <main className="flex-1 px-4 pb-12 sm:px-8">{children}</main>
                <footer className="page-bottom flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line px-4 pt-6 text-sm text-muted sm:px-8">
                  <Link href="/terms" className="hover:text-foreground">
                    利用規約
                  </Link>
                  <Link href="/privacy" className="hover:text-foreground">
                    プライバシーポリシー
                  </Link>
                  {/* パソコンでは左のメニューにもある。スマホのタブには入れず、ここから行く */}
                  <Link href="/settings" className="hover:text-foreground">
                    設定
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
              </div>
            </div>
            <MobileTabs />
          </PlayerProvider>
        </Progress>
        <ThemeWatcher />
        <Analytics />
      </body>
    </html>
  );
}
