import { expect, test } from '@playwright/test';

test('トップに棚が並び、横にはみ出さない', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '人気曲' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '新しいアルバム' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('検索欄に打つと、検索の画面で結果が絞られる', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: '検索' }).fill('love');
  await expect(page).toHaveURL(/\/search\?q=love/);
  await expect(page.getByRole('heading', { name: /楽曲/ })).toBeVisible();
});

test('人気曲を押すと、下の帯と右下の窓が出る', async ({ page }) => {
  await page.goto('/');
  // 棚の見出しの横には矢印のボタンもあるので、曲の行（.group）の再生ボタンを押す
  const row = page.locator('section').filter({ hasText: '人気曲' }).locator('.group').first();
  const title = (await row.locator('span.truncate').first().textContent())?.trim() ?? '';
  await row.locator('button').first().click();
  await expect(page.getByRole('button', { name: 'プレイヤーを閉じる' }).first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-player', 'dock');
  await expect(page.locator('iframe[src*="youtube.com/embed"]')).toBeAttached();
  await expect(page.getByText(title, { exact: true }).last()).toBeVisible();
});

test('お気に入りに入れた曲がライブラリに出て、開き直しても残る', async ({ page }) => {
  await page.goto('/');
  const heart = page.getByRole('button', { name: /をお気に入りに追加$/ }).first();
  const label = (await heart.getAttribute('aria-label')) ?? '';
  const title = label.replace(/をお気に入りに追加$/, '');
  await heart.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-player', 'dock');

  await page.goto('/library');
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
});

test('設定で明るいテーマを選ぶと切り替わり、開き直しても残る', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('明るいテーマ').check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByLabel('暗いテーマ').check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
