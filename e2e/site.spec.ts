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
  // スマホの幅では、検索欄は虫めがねの中にしまってある
  const opener = page.getByRole('button', { name: '検索', exact: true });
  if (await opener.isVisible()) await opener.click();
  await page.getByRole('searchbox', { name: '検索' }).locator('visible=true').fill('love');
  await expect(page).toHaveURL(/\/search\?q=love/);
  await expect(page.getByRole('heading', { name: /楽曲/ })).toBeVisible();
});

test('人気曲を押すと、曲の入ったアルバムの画面へ移り、アルバムの曲目の順に流れる', async ({
  page,
}) => {
  await page.goto('/');
  // 棚の見出しの横には矢印のボタンもあるので、曲の行（.group）の再生ボタンを押す
  const row = page.locator('section').filter({ hasText: '人気曲' }).locator('.group').first();
  const title = (await row.locator('span.truncate').first().textContent())?.trim() ?? '';
  await row.locator('button').first().click();

  await expect(page).toHaveURL(/\/albums\//);
  // アルバムの画面では、プレイヤーは右下の窓ではなく大きな置き場所に出る
  await expect(page.locator('html')).toHaveAttribute('data-player', 'slot');
  await expect(page.locator('iframe[src*="youtube.com/embed"]')).toBeAttached();
  // 押した曲が曲目の中で再生中になり、アルバムに2曲以上あれば「次の曲」が押せる（順番待ちがアルバムの曲目になった）
  // 自動のブラウザでは Topic の音源の一部が再生できず、次の曲へ進むことがある（CLAUDE.md の落とし穴）。
  // 押した曲そのものではなく、アルバムの曲目のどれかが再生中になったことを確かめる
  expect(title.length).toBeGreaterThan(0);
  await expect(page.locator('ol li').getByLabel('再生中')).toBeVisible();
  const playable = await page.locator('ol li button:not([disabled])').count();
  const last = await page.locator('ol li').last().filter({ hasText: title }).count();
  if (playable > 2 && last === 0) {
    await expect(page.getByRole('button', { name: '次の曲' })).toBeEnabled();
  }
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

test('お気に入りの曲の画面で並べ替えると、その順が残り、押した曲はその画面のまま流れる', async ({
  page,
}) => {
  await page.goto('/');
  // 人気曲から3曲をお気に入りに入れる
  const hearts = page.getByRole('button', { name: /をお気に入りに追加$/ });
  for (let i = 0; i < 3; i++) await hearts.first().click();

  await page.goto('/library/songs');
  const titles = () => page.locator('ol li span.font-bold').allTextContents();
  const before = await titles();
  expect(before).toHaveLength(3);

  // 3曲目のつまみを1曲目の上へドラッグする
  const handles = page.getByRole('button', { name: /を並べ替え$/ });
  const from = await handles.nth(2).boundingBox();
  const to = await handles.nth(0).boundingBox();
  if (!from || !to) throw new Error('つまみが見つからない');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(titles).toEqual([before[2], before[0], before[1]]);
  await page.reload();
  await expect.poll(titles).toEqual([before[2], before[0], before[1]]);

  // 2曲目を押すと、画面は移らず、大きな置き場所で流れる
  await page.locator('ol li').nth(1).getByRole('button').nth(1).click();
  await expect(page).toHaveURL(/\/library\/songs$/);
  await expect(page.locator('html')).toHaveAttribute('data-player', 'slot');
});
