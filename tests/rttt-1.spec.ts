import { test, expect } from '@playwright/test';

test.describe('RTTT-1', () => {
  test('should login with valid credentials and remember me disabled', { tag: ['@auth', '@login'] }, async ({ page, context }) => {
      const email = process.env.TEST_USER_EMAIL ?? '';
      const password = process.env.TEST_USER_PASSWORD ?? '';

      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password);

      const rememberMeCheckbox = page.getByRole('checkbox', { name: /remember me/i });
      if (await rememberMeCheckbox.isChecked()) {
        await rememberMeCheckbox.uncheck();
      }
      await expect(rememberMeCheckbox).not.toBeChecked();

      await page.getByRole('button', { name: /login|sign in/i }).click();
      await page.waitForURL(/\/dashboard$/i);
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

      await context.close();
      const newContext = await page.context().browser()!.newContext();
      const newPage = await newContext.newPage();
      await newPage.goto('/dashboard');
      await expect(newPage).toHaveURL(/\/login$/i);
      await newContext.close();
    });
});
