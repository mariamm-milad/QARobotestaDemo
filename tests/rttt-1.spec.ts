import { test, expect } from '@playwright/test';

test.describe('RTTT-1', () => {
  test('Login screen displays mandatory Email and Password fields', { tag: ['@functional', '@critical', '@login'] }, async ({ page }) => {
    // Navigate to login page
    await page.goto('/');

    // TODO: Navigate to login page from homepage
    await page.getByRole('link', { name: /login|sign in/i }).click();

    // Verify Email input field is displayed and required
    const emailField = page.getByRole('textbox', { name: /email/i });
    await expect(emailField).toBeVisible();
    await expect(emailField).toHaveAttribute('required', '');

    // Verify Password input field is displayed and required
    const passwordField = page.getByRole('textbox', { name: /password/i }).or(page.locator('input[type="password"]'));
    await expect(passwordField).toBeVisible();
    await expect(passwordField).toHaveAttribute('required', '');

    // Verify password field is masked (type="password")
    await expect(passwordField).toHaveAttribute('type', 'password');

    // Verify both fields are marked as mandatory (aria-required or required attribute)
    await expect(emailField).toHaveAttribute('aria-required', 'true').or(expect(emailField).toHaveAttribute('required', ''));
    await expect(passwordField).toHaveAttribute('aria-required', 'true').or(expect(passwordField).toHaveAttribute('required', ''));
  });
});
