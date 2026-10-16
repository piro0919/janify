import type { Metadata } from 'next';
import { InstallApp } from '@/components/install-app';
import { DockSetting } from '@/components/player/dock-setting';
import { KeyboardHelp } from '@/components/player/keyboard-help';
import { ResumeSetting } from '@/components/player/resume-setting';
import { SwipeBackSetting } from '@/components/swipe-back/swipe-back-setting';
import { ThemeSetting } from '@/components/theme/theme-setting';
import { Heading } from '@/components/heading';

export const metadata: Metadata = { title: '設定', robots: { index: false } };

export default function SettingsPage() {
  return (
    <div className="max-w-xl">
      <div className="pt-4 pb-4 sm:pb-6">
        <Heading as="h1" size="page" eyebrow="Settings">
          設定
        </Heading>
      </div>
      <ThemeSetting />
      <ResumeSetting />
      <DockSetting />
      <InstallApp />
      <SwipeBackSetting />
      <KeyboardHelp />
    </div>
  );
}
