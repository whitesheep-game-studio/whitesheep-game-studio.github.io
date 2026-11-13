import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('language selection waits for initialization when the translation script loads slowly', async ({ page }) => {
  let releaseScript;
  const ready = new Promise((resolve) => {
    releaseScript = resolve;
  });
  await page.route('**/i18n.js*', async (route) => {
    await ready;
    await route.continue();
  });
  try {
    await page.goto('/apps/kanjigyeol/privacy/', { waitUntil: 'commit' });
    await expect(page.locator('#language-trigger')).toBeVisible();
    await expect(page.locator('#language-trigger')).toBeDisabled();
    releaseScript();
    await expect(page.locator('#language-trigger')).toBeEnabled();
    await page.locator('#language-trigger').click();
    await page.locator('[data-language="en"]').click();
    await expect(page.locator('h1')).toHaveText('Kanjigyeol Privacy Policy');
  } finally {
    releaseScript();
  }
});

test('language switching translates homepage and persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#language-menu')).toBeHidden();
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="en"]').click();
  await expect(page.locator('h1')).toContainText('Small moments of joy');
  await page.reload();
  await expect(page.locator('h1')).toContainText('Small moments of joy');
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator('h1')).toContainText('小さな楽しさを');
});
test('app search and mobile layout', async ({ page }) => {
  await page.goto('/apps/');
  await expect(page.locator('[data-app]')).toHaveCount(2);
  await page.locator('#app-search').fill('nothing-found-123');
  await expect(page.locator('[data-app]:visible')).toHaveCount(0);
  await page.locator('#app-search').fill('');
  await expect(page.locator('[data-app]:visible')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
test('homepage accessibility', async ({ page }) => {
  await page.goto('/');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations.filter((v) => ['serious', 'critical'].includes(v.impact))).toEqual([]);
});

test('localized counts preserve filters and update in all three languages', async ({ page }) => {
  await page.goto('/apps/');
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="en"]').click();
  await page.locator('#app-status').selectOption('출시 예정');
  await expect(page.locator('[data-app]:visible')).toHaveCount(1);
  await expect(page.locator('#app-count')).toHaveText('1 / 2 total');
  await page.locator('#app-search').fill('no-match-ci');
  await expect(page.locator('#app-count')).toHaveText('0 / 2 total');
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator('#app-count')).toHaveText('全2件中0件');
  await expect(page.locator('#app-search')).toHaveValue('no-match-ci');
  await page.locator('#app-search').fill('');
  await expect(page.locator('#app-count')).toHaveText('全2件中1件');
  await page.locator('#app-status').selectOption('출시');
  await expect(page.locator('[data-app]:visible')).toHaveCount(1);
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="ko"]').click();
  await expect(page.locator('#app-count')).toHaveText('1개 / 전체 2개');
});

test('app privacy policy preserves data and advertising boundaries in every language', async ({ page }) => {
  await page.goto('/apps/kanjigyeol/privacy/');
  const article = page.locator('article.doc');
  for (const [locale, title, retention, scope, tabTitle] of [
    ['ko', '칸지결 개인정보처리방침', '90일 이내', '운영 배너는 활성화되지 않았습니다', '칸지결 · 개인정보 안내 · WhiteSheep Game Studio'],
    ['ja', 'カンジギョル プライバシーポリシー', '90日以内', '本番バナーは有効になっていません', 'カンジギョル · プライバシーポリシー · WhiteSheep Game Studio'],
    ['en', 'Kanjigyeol Privacy Policy', 'within 90 days', 'production banners are not enabled', 'Kanjigyeol · Privacy Policy · WhiteSheep Game Studio']
  ]) {
    await page.locator('#language-trigger').click();
    await page.locator(`[data-language="${locale}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(article.locator('h1')).toHaveText(title);
    await expect(page).toHaveTitle(tabTitle);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', tabTitle);
    await expect(article).toContainText(retention);
    await expect(article).toContainText(scope);
    await expect(article.locator('h2')).toHaveCount(12);
    await expect(article.locator('a[href="mailto:whitesheep0601@gmail.com"]')).toHaveCount(1);
    await expect(article).not.toContainText('이 페이지를 스토어 제출용 최종 방침으로 사용하지 않습니다');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await page.reload();
  await expect(article.locator('h1')).toHaveText('Kanjigyeol Privacy Policy');
  await expect(page).toHaveTitle('Kanjigyeol · Privacy Policy · WhiteSheep Game Studio');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Find WhiteSheep Game Studio games, apps, updates, and support in one place.');
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="ko"]').click();
  await expect(article.locator('h1')).toHaveText('칸지결 개인정보처리방침');
  await expect(page).toHaveTitle('칸지결 · 개인정보 안내 · WhiteSheep Game Studio');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact))).toEqual([]);
});

for (const [locale, status, label] of [
  ['ko', 'iOS 출시 · Android 출시 예정', 'App Store에서 다운로드'],
  ['ja', 'iOS 公開済み · Android 公開予定', 'App Storeからダウンロード'],
  ['en', 'iOS released · Android coming soon', 'Download on the App Store']
]) {
  test(`released iOS store link and icons in ${locale}`, async ({ page }) => {
    await page.goto('/');
    await page.locator('#language-trigger').click();
    await page.locator(`[data-language="${locale}"]`).click();
    for (const route of ['/', '/apps/', '/apps/kanjigyeol/']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      const badge = page.getByRole('link', { name: label, exact: true });
      await expect(badge).toHaveAttribute('href', 'https://apps.apple.com/app/id6832132208');
      await expect(page.locator('.status').first()).toHaveText(status);
      await expect(badge.locator('img')).toBeVisible();
      const icon = page.locator('img[src="/assets/kanjigyeol/icon.svg"]').first();
      await expect(icon).toBeVisible();
      expect(await icon.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await badge.locator('img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('a[href*="play.google.com"]')).toHaveCount(0);
    }
  });
}
