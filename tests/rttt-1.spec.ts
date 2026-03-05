import { test, expect } from '@playwright/test';

test.describe('RTTT-1', () => {
  test('should redirect to dashboard after successful login with valid credentials', { tag: ['@smoke', '@critical', '@auth'] }, async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL ?? '';
      const password = process.env.TEST_USER_PASSWORD ?? '';

      await page.goto('/login');
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();

      await page.getByRole('textbox', { name: /email/i }).fill(email);
      await page.getByRole('textbox', { name: /password/i }).fill(password);
      await page.getByRole('button', { name: /login|sign in/i }).click();

      await page.waitForURL(/\/dashboard/i);
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });
});
