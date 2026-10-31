import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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
  await expect(page.locator('[data-app]')).toHaveCount(1);
  await page.locator('#app-search').fill('nothing-found-123');
  await expect(page.locator('[data-app]:visible')).toHaveCount(0);
  await page.locator('#app-search').fill('');
  await expect(page.locator('[data-app]:visible')).toHaveCount(1);
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
  await page.locator('#app-status').selectOption('개발 중');
  await expect(page.locator('[data-app]:visible')).toHaveCount(1);
  await expect(page.locator('#app-count')).toHaveText('1 / 1 total');
  await page.locator('#app-search').fill('no-match-ci');
  await expect(page.locator('#app-count')).toHaveText('0 / 1 total');
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="ja"]').click();
  await expect(page.locator('#app-count')).toHaveText('全1件中0件');
  await expect(page.locator('#app-search')).toHaveValue('no-match-ci');
  await page.locator('#app-search').fill('');
  await expect(page.locator('#app-count')).toHaveText('全1件中1件');
  await page.locator('#app-status').selectOption('출시');
  await expect(page.locator('[data-app]:visible')).toHaveCount(0);
  await page.locator('#language-trigger').click();
  await page.locator('[data-language="ko"]').click();
  await expect(page.locator('#app-count')).toHaveText('0개 / 전체 1개');
});
