import { test, expect } from '@playwright/test';

test.describe('RTTT-2', () => {
  test('should display Remember Me checkbox unchecked by default', { tag: ['@boundary', '@low-priority', '@login', '@ui'] }, async ({ page }) => {
    // Navigate to the login screen
    await page.goto('/');

    // Wait for login form to be visible
    await page.waitForSelector('form', { timeout: 10000 });

    // Verify the 'Remember Me' checkbox is present
    const rememberMeCheckbox = page.getByRole('checkbox', { name: /remember me/i });
    await expect(rememberMeCheckbox).toBeVisible();

    // Verify the checkbox is unchecked by default
    await expect(rememberMeCheckbox).not.toBeChecked();

    // Additional verification that the checkbox is enabled and interactable
    await expect(rememberMeCheckbox).toBeEnabled();
  });
});
