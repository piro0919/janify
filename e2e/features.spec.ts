import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** トップの人気曲の1曲目を押して流し、その曲名を返す。アルバムの画面へ移り、大きな置き場所で流れる */
async function playPopular(page: Page): Promise<string> {
  await page.goto('/');
  const row = page.locator('section').filter({ hasText: '人気曲' }).locator('.group').first();
  const title = (await row.locator('span.truncate').first().textContent())?.trim() ?? '';
  await row.locator('button').first().click();
  await expect(page).toHaveURL(/\/albums\//);
  await expect(page.locator('html')).toHaveAttribute('data-player', 'slot');
  await expect(page.getByRole('button', { name: '一時停止' }).first()).toBeVisible();
  return title;
}

/** 下の帯（パソコン）か、アルバムの画面の再生の段（スマホ）にある、見えているボタン */
const shownButton = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name }).locator('visible=true').first();

test('開き直すと前の曲が止まった状態で戻り、続きを再生で流れる', async ({ page }) => {
  const title = await playPopular(page);
  await page.reload();
  const resume = page.getByRole('button', { name: `「${title}」の続きを再生` });
  await expect(resume).toBeVisible();
  // プレイヤーはまだ作らない
  await expect(page.locator('[data-player-frame] iframe')).toHaveCount(0);
  await resume.click();
  await expect(page.locator('[data-player-frame] iframe')).toBeAttached();
  await expect(page.getByRole('button', { name: '一時停止' }).first()).toBeVisible();
});

test('設定で「前回の続きから始める」を切ると、開き直しても前の曲は戻らない', async ({ page }) => {
  const title = await playPopular(page);
  const album = page.url();
  await page.goto('/settings');
  await page.getByLabel('前回の続きから始める').uncheck();
  await page.goto(album);
  await expect(page.getByRole('button', { name: `「${title}」の続きを再生` })).toHaveCount(0);
});

test('次に再生する曲の板から曲を押すと、その曲へ飛ぶ', async ({ page }) => {
  await playPopular(page);
  const src = await page.locator('[data-player-frame] iframe').getAttribute('src');
  await shownButton(page, '次に再生する曲').click();
  const panel = page.getByRole('dialog', { name: '次に再生する曲' });
  await expect(panel).toBeVisible();
  const rows = panel.locator('.group');
  // 1行目はいまの曲。アルバムが1曲だけなら次の曲は無い
  test.skip((await rows.count()) < 2, 'このアルバムは1曲だけ');
  await rows.nth(1).locator('button').first().click();
  await expect(page.locator('[data-player-frame] iframe')).not.toHaveAttribute('src', src ?? '');
});

test('スリープタイマーの「この曲が終わったら」は、曲の終わりで次へ進まずに止まる', async ({
  page,
}) => {
  await playPopular(page);
  const src = await page.locator('[data-player-frame] iframe').getAttribute('src');
  await shownButton(page, 'スリープタイマー').click();
  await page
    .getByRole('dialog', { name: 'スリープタイマー' })
    .getByRole('button', { name: 'この曲が終わったら' })
    .click();
  await expect(shownButton(page, /この曲が終わったら止まります/)).toBeVisible();
  await page.evaluate(() => (window as unknown as { __ytEnd: () => void }).__ytEnd());
  await expect(page.getByRole('button', { name: '再生', exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-player-frame] iframe')).toHaveAttribute('src', src ?? '');
});

test('流した曲が視聴履歴に残る', async ({ page }) => {
  const title = await playPopular(page);
  await page.goto('/library');
  await page.getByRole('link', { name: '履歴', exact: true }).click();
  await expect(page).toHaveURL(/\/library\/history$/);
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
});

test('検索の結果を押すと、その言葉が最近の検索に残る', async ({ page }) => {
  await page.goto('/search?q=love');
  await page.locator('main .group').first().locator('button').first().click();
  await expect(page).toHaveURL(/\/albums\//);
  await page.goto('/search');
  await page.getByRole('button', { name: 'love', exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=love/);
});

test('? でキーボード操作の一覧が開き、Esc で閉じる', async ({ page, isMobile }) => {
  test.skip(isMobile, 'キーボードはパソコンだけ');
  await page.goto('/');
  await page.keyboard.press('?');
  const panel = page.getByRole('dialog', { name: 'キーボード操作' });
  await expect(panel).toBeVisible();
  await expect(panel.getByText('10秒戻る・進む')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('設定でミニプレーヤーを左に寄せると、右下の窓が左に出る', async ({ page }) => {
  await playPopular(page);
  await page.goto('/settings');
  await page.getByLabel('左').check();
  await expect(page.locator('html')).toHaveAttribute('data-dock', 'left');
  await expect(page.locator('html')).toHaveAttribute('data-player', 'dock');
  const box = await page.locator('[data-player-frame]').boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(box && box.x + box.width / 2).toBeLessThan(width / 2);
  // 開き直しても左のまま（描く前に付ける）
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-dock', 'left');
});

test('右下の窓は、640px からは 16:9、それより狭い幅では 200×200', async ({ page }) => {
  await playPopular(page);
  await page.goto('/settings');
  await expect(page.locator('html')).toHaveAttribute('data-player', 'dock');
  const frame = page.locator('[data-player-frame]');
  await page.setViewportSize({ width: 744, height: 1000 });
  await expect.poll(async () => (await frame.boundingBox())?.width).toBe(356);
  expect((await frame.boundingBox())?.height).toBe(200);
  await page.setViewportSize({ width: 390, height: 800 });
  await expect.poll(async () => (await frame.boundingBox())?.width).toBe(200);
  expect((await frame.boundingBox())?.height).toBe(200);
});

test('パソコンでは、窓の角の引き手を引くと 16:9 のまま大きくなり、ダブルクリックで戻る', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, '大きさを変えるのはパソコンだけ');
  await playPopular(page);
  // 読み込み直すと前の曲を戻した状態（窓は再生ボタン）になるので、画面の中のリンクで移る
  await page.getByRole('link', { name: 'ホーム' }).locator('visible=true').first().click();
  const frame = page.locator('[data-player-frame]');
  await expect(page.locator('html')).toHaveAttribute('data-player', 'dock');
  await frame.hover();
  const arc = page.locator('[data-dock-arc="left"]');
  const box = await arc.boundingBox();
  if (!box) throw new Error('引き手が見えない');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 100, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  const grown = await frame.boundingBox();
  expect(grown?.width).toBeGreaterThan(400);
  expect(Math.abs((grown?.width ?? 0) / (grown?.height ?? 1) - 16 / 9)).toBeLessThan(0.02);
  await arc.dblclick();
  await expect.poll(async () => (await frame.boundingBox())?.width).toBe(356);
});
