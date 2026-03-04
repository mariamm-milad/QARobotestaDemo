import { test, expect } from '@playwright/test';

test.describe('RTTT-1', () => {
  import { test, expect } from '@playwright/test';
  import { LoginPage } from '../pages/LoginPage';
  import { DashboardPage } from '../pages/DashboardPage';

  test.describe('Login Page - Authentication (Page Object Model)', { tag: ['@auth', '@RTTT-1'] }, () => {
    let loginPage: LoginPage;
    const email = process.env.TEST_USER_EMAIL ?? '';
    const password = process.env.TEST_USER_PASSWORD ?? '';

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    test.afterEach(async ({ page }, testInfo) => {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });

    test('should display mandatory Email and Password input fields', { tag: ['@smoke', '@ui'] }, async () => {
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();

      // Verify fields are required
      await expect(loginPage.emailInput).toHaveAttribute('required', '');
      await expect(loginPage.passwordInput).toHaveAttribute('required', '');
    });

    test('should mask password input for security', { tag: ['@security'] }, async () => {
      const isPasswordMasked = await loginPage.isPasswordMasked();
      expect(isPasswordMasked).toBe(true);

      // Verify password characters are masked when typing
      await loginPage.passwordInput.fill('testpassword123');
      const displayValue = await loginPage.passwordInput.inputValue();
      expect(displayValue).toBe('testpassword123'); // Input value is accessible but display is masked
    });

    test('should login successfully with valid credentials and redirect to dashboard', { tag: ['@smoke', '@positive'] }, async ({ page }) => {
      test.setTimeout(30_000);

      await loginPage.login(email, password);

      // Wait for navigation to dashboard
      await page.waitForURL(/\/dashboard$/i);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.waitForDashboardLoad();

      await expect(dashboardPage.dashboardHeading).toBeVisible();
      expect(page.url()).toMatch(/\/dashboard$/i);
    });

    test('should display clear error message for invalid credentials', { tag: ['@negative', '@error-handling'] }, async () => {
      await loginPage.login('invalid@example.com', 'wrongpassword');

      await expect(loginPage.errorAlert).toBeVisible();
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toMatch(/invalid|incorrect|failed|error/i);
    });

    test('should display error message for empty email field', { tag: ['@negative', '@validation'] }, async () => {
      await loginPage.login('', password);

      await expect(loginPage.errorAlert).toBeVisible();
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toMatch(/email.*required|please.*email/i);
    });

    test('should display error message for empty password field', { tag: ['@negative', '@validation'] }, async () => {
      await loginPage.login(email, '');

      await expect(loginPage.errorAlert).toBeVisible();
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toMatch(/password.*required|please.*password/i);
    });

    test('should display error message for invalid email format', { tag: ['@negative', '@validation'] }, async () => {
      await loginPage.login('invalid-email-format', password);

      await expect(loginPage.errorAlert).toBeVisible();
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toMatch(/invalid.*email|email.*format|valid.*email/i);
    });

    test('should handle multiple failed login attempts', { tag: ['@negative', '@security'] }, async () => {
      // First failed attempt
      await loginPage.login('wrong@example.com', 'wrongpass');
      await expect(loginPage.errorAlert).toBeVisible();

      // Second failed attempt
      await loginPage.clearEmailInput();
      await loginPage.clearPasswordInput();
      await loginPage.login('another@wrong.com', 'wrongpass2');
      await expect(loginPage.errorAlert).toBeVisible();

      // Verify error message is still displayed
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toMatch(/invalid|incorrect|failed/i);
    });

    test('should clear form fields when cleared', { tag: ['@ui', '@functionality'] }, async () => {
      await loginPage.login('test@example.com', 'testpassword');

      await loginPage.clearEmailInput();
      await loginPage.clearPasswordInput();

      const emailValue = await loginPage.getEmailInputValue();
      const passwordValue = await loginPage.getPasswordInputValue();

      expect(emailValue).toBe('');
      expect(passwordValue).toBe('');
    });
  });

  test.describe('Cross-Browser Login Compatibility', { tag: ['@cross-browser', '@RTTT-1'] }, () => {
    let loginPage: LoginPage;
    const email = process.env.TEST_USER_EMAIL ?? '';
    const password = process.env.TEST_USER_PASSWORD ?? '';

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    test.afterEach(async ({ page }, testInfo) => {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });

    test('should work consistently across different browsers', { tag: ['@smoke', '@compatibility'] }, async ({ page, browserName }) => {
      test.setTimeout(30_000);

      // Verify login form elements are present
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();

      // Verify password masking works across browsers
      const isPasswordMasked = await loginPage.isPasswordMasked();
      expect(isPasswordMasked).toBe(true);

      // Verify login functionality works
      await loginPage.login(email, password);
      await page.waitForURL(/\/dashboard$/i);

      const dashboardPage = new DashboardPage(page);
      await expect(dashboardPage.dashboardHeading).toBeVisible();

      // Log browser info for debugging
      console.log(`Login test passed on ${browserName}`);
    });
  });

  import { Page, Locator } from '@playwright/test';

  export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly errorAlert: Locator;

    constructor(page: Page) {
      this.page = page;
      this.emailInput = page.getByLabel(/email/i);
      this.passwordInput = page.getByLabel(/password/i);
      this.loginButton = page.getByRole('button', { name: /login|sign in/i });
      this.errorAlert = page.getByRole('alert');
    }

    async goto() {
      await this.page.goto('/login');
      await this.page.waitForLoadState('networkidle');
    }

    async login(email: string, password: string) {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
    }

    async isEmailInputVisible() {
      return await this.emailInput.isVisible();
    }

    async isPasswordInputVisible() {
      return await this.passwordInput.isVisible();
    }

    async isPasswordMasked() {
      const inputType = await this.passwordInput.getAttribute('type');
      return inputType === 'password';
    }

    async getErrorMessage() {
      return await this.errorAlert.textContent();
    }

    async isLoginButtonEnabled() {
      return await this.loginButton.isEnabled();
    }

    async clearEmailInput() {
      await this.emailInput.clear();
    }

    async clearPasswordInput() {
      await this.passwordInput.clear();
    }

    async getEmailInputValue() {
      return await this.emailInput.inputValue();
    }

    async getPasswordInputValue() {
      return await this.passwordInput.inputValue();
    }
  }

  test('should login with valid email and password', { tag: ['@smoke', '@auth'] }, async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL ?? '';
    const password = process.env.TEST_USER_PASSWORD ?? '';

    await page.goto('https://robotesta.ai/login');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /login|sign in/i }).click();

    await page.waitForURL(/dashboard/i);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  import { Page, Locator } from '@playwright/test';

  export class DashboardPage {
    readonly page: Page;
    readonly dashboardHeading: Locator;
    readonly userProfile: Locator;

    constructor(page: Page) {
      this.page = page;
      this.dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
      this.userProfile = page.getByRole('button', { name: /profile|user|account/i });
    }

    async isDashboardVisible() {
      return await this.dashboardHeading.isVisible();
    }

    async waitForDashboardLoad() {
      await this.page.waitForURL(/\/dashboard$/i);
      await this.dashboardHeading.waitFor({ state: 'visible' });
    }

    async isUserProfileVisible() {
      return await this.userProfile.isVisible();
    }
  }
});
