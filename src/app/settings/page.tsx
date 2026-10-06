import type { Metadata } from 'next';
import { ThemeSetting } from '@/components/theme/theme-setting';

export const metadata: Metadata = { title: '設定', robots: { index: false } };

export default function SettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="pt-4 pb-6 text-3xl font-bold">設定</h1>
      <ThemeSetting />
    </div>
  );
}
