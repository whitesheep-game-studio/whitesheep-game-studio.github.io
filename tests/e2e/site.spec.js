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
  await expect(page.locator('[data-app]')).toHaveCount(12);
  await page.locator('#app-search').fill('nothing-found-123');
  await expect(page.locator('[data-app]:visible')).toHaveCount(0);
  await page.locator('#app-search').fill('');
  await expect(page.locator('[data-app]:visible')).toHaveCount(12);
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
  await expect(page.locator('[data-app]:visible')).toHaveCount(9);
  await expect(page.locator('#app-count')).toHaveText('9 / 12 total');
  await page.locator('#app-search').fill('no-match-ci');
  await expect(page.locator('#app-count')).toHaveText('0 / 12 total');
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator('#app-count')).toHaveText('全12件中0件');
  await expect(page.locator('#app-search')).toHaveValue('no-match-ci');
  await page.locator('#app-search').fill('');
  await expect(page.locator('#app-count')).toHaveText('全12件中9件');
  await page.locator('#app-status').selectOption('출시');
  await expect(page.locator('[data-app]:visible')).toHaveCount(3);
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="ko"]').click();
  await expect(page.locator('#app-count')).toHaveText('3개 / 전체 12개');
});

test('app privacy policy preserves data and advertising boundaries in every language', async ({ page }) => {
  await page.goto('/apps/kanjigyeol/privacy/');
  const article = page.locator('article.doc');
  for (const [locale, title, retention, scope, tabTitle] of [
    ['ko', '칸지결 개인정보처리방침', '90일 이내', '이 배너는 Google 광고가 아니며 앱 데이터를 보내지 않습니다', '칸지결 · 개인정보 안내 · WhiteSheep Game Studio'],
    [
      'ja',
      'カンジギョル プライバシーポリシー',
      '90日以内',
      'このバナーはGoogle広告ではなく、アプリのデータを送信しません',
      'カンジギョル · プライバシーポリシー · WhiteSheep Game Studio'
    ],
    ['en', 'Kanjigyeol Privacy Policy', 'within 90 days', 'This banner is not a Google ad and does not send app data', 'Kanjigyeol · Privacy Policy · WhiteSheep Game Studio']
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

const APP_STORE_HREF = 'https://apps.apple.com/kr/app/%EC%B9%B8%EC%A7%80%EA%B2%B0/id6832132208';
const PLAY_STORE_HREF = 'https://play.google.com/store/apps/details?id=com.whitesheep0601.kanji';
for (const [locale, status, label, playLabel] of [
  ['ko', 'iOS · Android 출시', 'App Store에서 다운로드', 'Google Play에서 다운로드'],
  ['ja', 'iOS・Android 公開済み', 'App Storeからダウンロード', 'Google Playでダウンロード'],
  ['en', 'iOS and Android released', 'Download on the App Store', 'Get it on Google Play']
]) {
  test(`released iOS and Android store links and icons in ${locale}`, async ({ page }) => {
    await page.goto('/');
    await page.locator('#language-trigger').click();
    await page.locator(`[data-language="${locale}"]`).click();
    for (const route of ['/', '/apps/', '/apps/kanjigyeol/']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      const badge = page.getByRole('link', { name: label, exact: true }).first();
      const playBadge = page.getByRole('link', { name: playLabel, exact: true }).first();
      await expect(badge).toHaveAttribute('href', APP_STORE_HREF);
      await expect(playBadge).toHaveAttribute('href', PLAY_STORE_HREF);
      await expect(page.locator('.status').first()).toHaveText(status);
      await expect(badge.locator('img')).toBeVisible();
      await expect(playBadge.locator('img')).toBeVisible();
      const icon = page.locator('img[src="/assets/kanjigyeol/icon.svg"]').first();
      await expect(icon).toBeVisible();
      expect(await icon.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await badge.locator('img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await playBadge.locator('img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('a[href*="play.google.com"]')).toHaveCount(1);
    }
    await page.goto('/apps/kanjigyeol/');
    await expect(page.locator('.store-links')).toHaveCount(1);
    await playBadgeFocus(page, playLabel);
  });
}

async function playBadgeFocus(page, playLabel) {
  const playBadge = page.getByRole('link', { name: playLabel, exact: true }).first();
  await playBadge.focus();
  await expect(playBadge).toBeFocused();
}

test('only the released Android app links to Google Play; other apps keep their App Store badge only', async ({ page }) => {
  await page.goto('/apps/');
  for (const slug of ['jgrammar', 'itcert']) {
    const card = page.locator(`article.app:has(a.app-main[href="/apps/${slug}/"])`);
    await expect(card.locator('a[href*="apps.apple.com"]')).toHaveCount(1);
    await expect(card.locator('a[href*="play.google.com"]')).toHaveCount(0);
  }
  await expect(page.locator('a[href*="play.google.com"]')).toHaveCount(1);
});

test('unreleased study apps show a coming-soon status, translated policies and no store links', async ({ page }) => {
  const apps = [
    ['itkcert', '한국 IT 국가자격증 공부', '韓国IT国家資格勉強', 'Korean IT Certification Study'],
    ['ac', '매일매일 회계학', '毎日会計学', 'Daily Accounting'],
    ['fi', '매일매일 재무관리', '毎日財務管理', 'Daily Finance'],
    ['ec', '매일매일 경제학', '毎日経済学', 'Daily Economics'],
    ['tax', '매일매일 세법', '毎日税法', 'Daily Tax Law'],
    ['claw', '매일매일 상법', '毎日商法', 'Daily Commercial Law'],
    ['audit', '매일매일 회계감사', '毎日会計監査', 'Daily Auditing'],
    ['safetyengineer', '안전 국가자격증 공부', '安全衛生国家資格勉強', 'Safety Certification Study']
  ];
  await page.goto('/');
  for (const [index, locale, status, privacy, draft] of [
    [1, 'ko', 'Android·iOS 출시 준비 중', '개인정보처리방침', '이 방침은 출시 전 초안이며 앱 출시와 함께 확정됩니다.'],
    [2, 'ja', 'Android・iOS 公開準備中', 'プライバシーポリシー', '本ポリシーは公開前のドラフトであり、アプリの公開に合わせて確定します。'],
    [3, 'en', 'Android and iOS coming soon', 'Privacy Policy', 'This policy is a pre-release draft and will be finalized with the app release.']
  ]) {
    await page.locator('#language-trigger').click();
    await page.locator(`[data-language="${locale}"]`).click();
    for (const app of apps) {
      await page.goto(`/apps/${app[0]}/`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page).toHaveTitle(`${app[index]} · WhiteSheep Game Studio`);
      await expect(page.locator('.hero .status')).toHaveText(status);
      await expect(page.locator('a[href*="apps.apple.com"], a[href*="play.google.com"]')).toHaveCount(0);
      const icon = page.locator('.hero-mark img');
      expect(await icon.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      await page.goto(`/apps/${app[0]}/privacy/`);
      await expect(page.locator('article.doc h1')).toHaveText(`${app[index]} ${privacy}`);
      await expect(page.locator('article.doc .note')).toHaveText(draft);
      if (locale !== 'ko') expect((await page.locator('article.doc').innerText()).replaceAll('초록지붕이층집', '')).not.toMatch(/[가-힣]/u);
    }
  }
});
