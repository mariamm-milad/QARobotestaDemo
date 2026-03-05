import { test, expect } from '@playwright/test';

test.describe('RTTT-1', () => {
  test('should display mandatory Email and Password fields on login screen', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
      await page.goto('/login');

      // Verify Email field is present and mandatory
      const emailField = page.getByRole('textbox', { name: /email/i });
      await expect(emailField).toBeVisible();
      await expect(emailField).toHaveAttribute('required');

      // Verify Password field is present and mandatory
      const passwordField = page.getByRole('textbox', { name: /password/i });
      await expect(passwordField).toBeVisible();
      await expect(passwordField).toHaveAttribute('type', 'password');
      await expect(passwordField).toHaveAttribute('required');

      // Verify password input is masked for security
      await passwordField.fill('testpassword');
      await expect(passwordField).toHaveAttribute('type', 'password');
    });
});
