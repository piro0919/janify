'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { arrived } from '@/lib/leave';

/**
 * 住所が変わったことを、戻る先の数（leave.ts）に伝える。ブラウザの「戻る」「進む」で変わったかを popstate で見分けて渡す。
 * 画面には何も出さない（layout.tsx に置く）
 */
export function NavigationDepth() {
  const pathname = usePathname();
  // 前に数えた住所。開いた最初の住所は数えない。同じ住所で effect がもう一度走っても（開発の StrictMode）数えない
  const last = useRef<string | null>(null);
  const popped = useRef(false);

  useEffect(() => {
    const onPop = () => {
      popped.current = true;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const prev = last.current;
    last.current = pathname;
    if (prev === null || prev === pathname) return;
    arrived(popped.current);
    popped.current = false;
  }, [pathname]);

  return null;
}
