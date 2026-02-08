import { test, expect } from '@playwright/test';

const BASE_URL = 'https://robotesta.app';

test.describe('User Invitation', () => {

  async function login(page) {
    await page.goto(`${BASE_URL}/login`);
    await page.getByTestId('email-input').fill('admin@robotesta.com');
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/dashboard/);
  }

  test('Invite user', async ({ page }) => {
    await login(page);

    await page.getByTestId('users-menu').click();

    await page.getByTestId('invite-user-button').click();

    const email = `user${Date.now()}@test.com`;

    await page.getByTestId('email-field').fill(email);

    await page.getByTestId('ok-button').click();

    await expect(
      page.getByTestId(`user-row-${email}`)
    ).toBeVisible();
  });

});
