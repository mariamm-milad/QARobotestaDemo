import { test, expect } from '@playwright/test';

test.describe('RAB-9', () => {
  test('should display Remember Me checkbox unchecked by default', async ({ page }) => {
      await page.goto('https://robotesta.ai');

      // Navigate to login screen if not already there
      const loginButton = page.getByRole('button', { name: /login|sign in/i });
      if (await loginButton.isVisible()) {
        await loginButton.click();
      }

      // Verify Remember Me checkbox is present
      const rememberMeCheckbox = page.getByRole('checkbox', { name: /remember me/i });
      await expect(rememberMeCheckbox).toBeVisible();

      // Verify checkbox is unchecked by default
      await expect(rememberMeCheckbox).not.toBeChecked();
    });
});
