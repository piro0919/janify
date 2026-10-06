'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './icon';

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'ホーム', icon: 'home' },
  { href: '/artists', label: 'アーティスト', icon: 'artist' },
  { href: '/albums', label: 'アルバム', icon: 'album' },
  { href: '/decades', label: '年代', icon: 'decade' },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
}

export function Logo() {
  return (
    <Link href="/" className="text-xl font-bold tracking-tight">
      Jani<span className="text-accent">fy</span>
    </Link>
  );
}

/** パソコンの幅で左に置くメニュー */
export function Sidebar() {
  const active = useActive();
  return (
    <nav className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-line bg-sidebar px-3 pt-4 md:flex">
      <div className="mb-5 px-3">
        <Logo />
      </div>
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-4 rounded-lg px-3 py-2.5 text-sm font-bold ${
            active(item.href) ? 'bg-surface text-foreground' : 'text-muted hover:text-foreground'
          }`}
        >
          <Icon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** スマホの幅で下に置くタブ */
export function MobileTabs() {
  const active = useActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid h-14 grid-cols-4 border-t border-line bg-sidebar md:hidden">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold ${
            active(item.href) ? 'text-foreground' : 'text-muted'
          }`}
        >
          <Icon name={item.icon} className="size-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
