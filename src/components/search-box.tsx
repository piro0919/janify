'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from './icon';

/**
 * 上の帯の検索欄。打つと少し待ってから検索の画面へ移り、結果をその場で絞る。
 * 日本語の変換中に URL を書き換えると入力が崩れるので、変換が終わるまでは送らない
 */
export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const onSearch = pathname === '/search';
  const urlQuery = onSearch ? (params.get('q') ?? '') : '';
  const [text, setText] = useState(urlQuery);
  const [composing, setComposing] = useState(false);

  // 戻る・進むなどで URL の語が変わったら、欄もそれに合わせる
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery);
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery);
    setText(urlQuery);
  }

  useEffect(() => {
    const q = text.trim();
    if (composing || q === urlQuery) return;
    const id = setTimeout(() => {
      const url = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
      if (onSearch) router.replace(url, { scroll: false });
      else if (q) router.push(url);
    }, 250);
    return () => clearTimeout(id);
  }, [text, composing, urlQuery, onSearch, router]);

  return (
    <search className="w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = text.trim();
          router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
        }}
        className="relative"
      >
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={(e) => {
            setComposing(false);
            setText(e.currentTarget.value);
          }}
          placeholder="曲、アルバム、アーティストを検索"
          aria-label="検索"
          className="h-10 w-full rounded-lg border border-line/60 bg-sidebar/60 pr-3 pl-10 text-sm placeholder:text-muted focus:border-foreground/30 focus:outline-none"
        />
      </form>
    </search>
  );
}
