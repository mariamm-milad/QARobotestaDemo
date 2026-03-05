import { test, expect } from '@playwright/test';

test.describe('RTTT-1', () => {
  test('should mask password input characters for security', { tag: ['@security', '@high'] }, async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();

      const passwordField = page.getByRole('textbox', { name: /password/i });
      await passwordField.fill('testPassword123');

      // Verify password field has type="password" attribute for masking
      await expect(passwordField).toHaveAttribute('type', 'password');

      // Verify the actual value is stored correctly but not visually displayed
      await expect(passwordField).toHaveValue('testPassword123');
    });
});
