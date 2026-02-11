// login-invalid.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login with invalid credentials', () => {
  const baseUrl = 'https://robotesta.ai';
  const invalidEmail = 'invalid@example.com';
  const invalidPassword = 'wrongpassword';

  test('should display "User not found" message for wrong email/password', async ({ page }) => {
    // Go to home page
    await page.goto(baseUrl);

    // Click the Login button (header) and wait for login form
    const loginHeaderButton = page.getByRole('button', { name: 'Login' }).first();
    await loginHeaderButton.waitFor({ state: 'visible', timeout: 5000 });
    await loginHeaderButton.click();

    // Wait for email input to appear
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });

    // Fill invalid credentials
    await emailInput.fill(invalidEmail);
    await passwordInput.fill(invalidPassword);

    // Optional: blur inputs to trigger validation
    await emailInput.blur();
    await passwordInput.blur();

    // Wait for submit button to become enabled
    const submitButton = page.getByRole('button', { name: /login|sign in/i }).first();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    // Click submit button
    await submitButton.click();

    // ---- FIXED ERROR MESSAGE VALIDATION ----
    const errorMessage = page.locator('text=User not found');
    await errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    await expect(errorMessage).toHaveText(/user not found/i);
    // ---------------------------------------

    // Verify still on login page
    await expect(page).toHaveURL(/login/);
  });
});
