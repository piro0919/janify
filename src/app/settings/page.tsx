import type { Metadata } from 'next';
import { InstallApp } from '@/components/install-app';
import { ThemeSetting } from '@/components/theme/theme-setting';
import { PlayingAmbient } from '@/components/playing-ambient';

export const metadata: Metadata = { title: '設定', robots: { index: false } };

export default function SettingsPage() {
  return (
    <div className="max-w-xl">
      <PlayingAmbient />
      <h1 className="pt-4 pb-6 text-3xl font-bold">設定</h1>
      <ThemeSetting />
      <InstallApp />
    </div>
  );
}
