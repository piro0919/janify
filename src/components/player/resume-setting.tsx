'use client';

import { useSyncExternalStore } from 'react';
import { resumeEnabled, setResumeEnabled, subscribeResume } from './player-resume';

/** 設定の画面の「開き直したとき」。前に流していた曲を、開き直したときに止まった状態で戻すか（player-resume.ts） */
export function ResumeSetting() {
  const on = useSyncExternalStore(subscribeResume, resumeEnabled, () => true);
  return (
    <section className="mt-7 sm:mt-10">
      <h2 className="mb-3 font-bold">開き直したとき</h2>
      <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-foreground/8">
        <input
          type="checkbox"
          checked={on}
          onChange={() => setResumeEnabled(!on)}
          className="size-4 accent-accent"
        />
        前回の続きから始める
      </label>
    </section>
  );
}
