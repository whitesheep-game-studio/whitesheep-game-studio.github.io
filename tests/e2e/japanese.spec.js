import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('SNS landing keeps exactly two apps, public downloads, QR and no global navigation', async ({ page }) => {
  await page.goto('/japanese/');
  await expect(page.locator('[data-japanese-app]')).toHaveCount(2);
  await expect(page.locator('nav')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('header .brand')).toHaveAttribute('href', '/');
  await expect(page.locator('.japanese-release')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://whitesheep-game-studio.github.io/assets/japanese/share.png');
  await expect(page.locator('.download-option[href]')).toHaveCount(3);
  await expect(page.locator('.download-pending')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.download-pending a')).toHaveCount(0);
  for (const image of await page.locator('img').all()) {
    // Mobile engines may defer decoding QR images hidden by the responsive CSS.
    if (!(await image.isVisible())) continue;
    await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0), { message: await image.getAttribute('src') }).toBe(true);
  }
  await page.goto('/');
  await expect(page.locator('a[href="/japanese/"]')).toHaveCount(0);
});

test('language captions follow the selected locale on the landing and homepage', async ({ page }, testInfo) => {
  for (const route of ['/japanese/', '/']) {
    await page.goto(route);
    for (const [locale, captions] of [
      ['ko', ['· 한국어', '· 일본어', '· 영어']],
      ['ja', ['· 韓国語', '· 日本語', '· 英語']],
      ['en', ['· Korean', '· Japanese', '· English']]
    ]) {
      await page.locator('#language-trigger').click();
      await page.locator(`[data-language="${locale}"]`).click();
      await page.locator('#language-trigger').click();
      await expect(page.locator('#language-menu small')).toHaveText(captions);
      const chevron = await page.locator('.language-chevron').boundingBox();
      expect(chevron.width).toBeGreaterThanOrEqual(20);
      if (route === '/japanese/' && locale === 'ja') {
        await page.screenshot({ path: testInfo.outputPath('language-menu-ja.png'), fullPage: true });
      }
      await page.keyboard.press('Escape');
    }
  }
  await page.goto('/japanese/');
  await page.locator('header .brand').click();
  await expect(page).toHaveURL('/');
});

test('landing translates metadata, persists language and supports Escape', async ({ page }) => {
  await page.goto('/japanese/');
  for (const [locale, title, description] of [
    ['ko', '일상을 채우는 작은 배움', '매일 한 장씩, 일본어에 가까워지는 시간.'],
    ['ja', '日々を満たす、小さな学び', '毎日一枚ずつ、日本語に近づく時間。'],
    ['en', 'Small lessons for everyday life', 'One card a day, a little closer to Japanese.']
  ]) {
    await page.locator('#language-trigger').click();
    await page.locator(`[data-language="${locale}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', await page.title());
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('#language-trigger').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-language="en"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#language-menu')).toBeHidden();
  await expect(page.locator('#language-trigger')).toBeFocused();
});

test('landing fits small screens and dark mode with accessible downloads', async ({ page }, testInfo) => {
  await page.goto('/japanese/');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) {
      const second = await page.locator('[data-japanese-app="jgrammar"]').boundingBox();
      expect(second.y + second.height).toBeLessThan(844);
      await expect(page.locator('.download-qr').first()).toBeHidden();
      await page.screenshot({ path: testInfo.outputPath('japanese-mobile.png'), fullPage: true });
    }
  }
  for (const colorScheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(result.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`japanese-${colorScheme}.png`), fullPage: true });
  }
});

test('Instagram user agent and blocked storage preserve direct store downloads', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 400.0.0.0'
  });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get: () => {
        throw new Error('Storage unavailable');
      }
    });
  });
  const page = await context.newPage();
  await page.goto('/japanese/');
  await expect(page.locator('#language-trigger')).toBeEnabled();
  await expect(page.locator('a[href^="https://apps.apple.com/"]')).toHaveCount(2);
  await expect(page.locator('a[href^="https://play.google.com/store/apps/details?"]')).toHaveCount(1);
  await context.close();
});

test('without JavaScript the authored content and downloads remain usable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/japanese/');
  await expect(page.locator('h1')).toHaveText('일상을 채우는 작은 배움');
  await expect(page.locator('.download-option[href]')).toHaveCount(3);
  await context.close();
});
