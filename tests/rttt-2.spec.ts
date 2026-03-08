import { test, expect } from '@playwright/test';

test.describe('RTTT-2', () => {
  test('should display Remember Me checkbox on login screen that is unchecked by default', { tag: ['@functional', '@high-priority', '@login'] }, async ({ page }) => {
    // Navigate to the login screen
    await page.goto('/');

    // TODO: Navigate to actual login page if not already there
    const loginButton = page.getByRole('button', { name: /login|sign in/i });
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Wait for login form to be visible
    await page.waitForSelector('form, [data-testid*="login"], input[type="email"], input[type="password"]');

    // Verify Remember Me checkbox is visible
    const rememberMeCheckbox = page.getByRole('checkbox', { name: /remember me/i }); // TODO: Replace with verified selector when available
    await expect(rememberMeCheckbox).toBeVisible();

    // Verify checkbox is unchecked by default
    await expect(rememberMeCheckbox).not.toBeChecked();

    // Additional verification that the checkbox label is present
    const rememberMeLabel = page.getByText(/remember me/i);
    await expect(rememberMeLabel).toBeVisible();
  });
});
