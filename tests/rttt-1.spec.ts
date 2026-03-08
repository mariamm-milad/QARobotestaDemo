import { test, expect } from '@playwright/test';

test.describe('RTTT-1', () => {
  import { test, expect } from '@playwright/test';
  import { LoginPage } from '../page-objects/login-page';
  import { DashboardPage } from '../page-objects/dashboard-page';

  test.describe('Login Functionality - User Authentication', { tag: ['@auth', '@critical'] }, () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.navigate();
    });

    test.afterEach(async ({ page }, testInfo) => {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });

    test('should display mandatory email and password input fields', { tag: ['@smoke', '@ui'] }, async ({ page }) => {
      await loginPage.expectLoaded();
      await loginPage.expectFieldsRequired();
    });

    test('should successfully login with valid registered credentials', { tag: ['@smoke', '@positive'] }, async ({ page }) => {
      test.setTimeout(30_000);

      const email = process.env.TEST_USER_EMAIL ?? '';
      const password = process.env.TEST_USER_PASSWORD ?? '';

      await loginPage.login(email, password);
      await page.waitForURL(/\/dashboard/i);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.expectUserLoggedIn();
    });

    test('should redirect to dashboard landing page after successful login', { tag: ['@smoke', '@navigation'] }, async ({ page }) => {
      test.setTimeout(30_000);

      const email = process.env.TEST_USER_EMAIL ?? '';
      const password = process.env.TEST_USER_PASSWORD ?? '';

      await loginPage.login(email, password);
      await page.waitForURL(/\/dashboard/i);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.expectLoaded();
      await expect(page).toHaveURL(/\/dashboard/i);
    });

    test('should display clear error message for invalid credentials', { tag: ['@negative', '@error-handling'] }, async ({ page }) => {
      await loginPage.login('invalid@example.com', 'wrongpassword');
      await loginPage.expectErrorMessage(/invalid|incorrect|failed|error/i);
    });

    test('should display error message for non-registered email', { tag: ['@negative', '@validation'] }, async ({ page }) => {
      await loginPage.login('nonexistent@example.com', 'anypassword');
      await loginPage.expectErrorMessage(/invalid|not found|incorrect|failed/i);
    });

    test('should display error message for empty email field', { tag: ['@negative', '@validation'] }, async ({ page }) => {
      await loginPage.login('', 'somepassword');
      await loginPage.expectErrorMessage(/email.*required|please.*email/i);
    });

    test('should display error message for empty password field', { tag: ['@negative', '@validation'] }, async ({ page }) => {
      await loginPage.login('user@example.com', '');
      await loginPage.expectErrorMessage(/password.*required|please.*password/i);
    });

    test('should display error message for both empty fields', { tag: ['@negative', '@validation'] }, async ({ page }) => {
      await loginPage.login('', '');
      await loginPage.expectErrorMessage(/required|please.*fill/i);
    });

    test('should mask password input for security', { tag: ['@security', '@ui'] }, async ({ page }) => {
      await loginPage.expectPasswordMasked();

      await loginPage.passwordInput.fill('testpassword123');
      await loginPage.expectPasswordMasked();

      const inputValue = await loginPage.passwordInput.inputValue();
      expect(inputValue).toBe('testpassword123');
    });

    test('should display error for invalid email format', { tag: ['@negative', '@validation'] }, async ({ page }) => {
      await loginPage.login('invalid-email-format', 'somepassword');
      await loginPage.expectErrorMessage(/invalid.*email|email.*format/i);
    });

    test('should handle SQL injection attempt in email field', { tag: ['@security', '@negative'] }, async ({ page }) => {
      await loginPage.login("'; DROP TABLE users; --", 'password');
      await loginPage.expectErrorMessage(/invalid|error|failed/i);
    });

    test('should handle XSS attempt in password field', { tag: ['@security', '@negative'] }, async ({ page }) => {
      await loginPage.login('user@example.com', '<script>alert("xss")</script>');
      await loginPage.expectErrorMessage(/invalid|error|failed/i);
    });

    test('should prevent login with very long email input', { tag: ['@negative', '@boundary'] }, async ({ page }) => {
      const longEmail = 'a'.repeat(300) + '@example.com';
      await loginPage.login(longEmail, 'password');
      await loginPage.expectErrorMessage(/invalid|too long|error/i);
    });

    test('should prevent login with very long password input', { tag: ['@negative', '@boundary'] }, async ({ page }) => {
      const longPassword = 'a'.repeat(500);
      await loginPage.login('user@example.com', longPassword);
      await loginPage.expectErrorMessage(/invalid|too long|error/i);
    });
  });

  test.describe('Login Functionality - Cross-Browser Compatibility', { tag: ['@cross-browser'] }, () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.navigate();
    });

    test('should work consistently across different browsers', { tag: ['@compatibility'] }, async ({ page }) => {
      test.setTimeout(30_000);

      await loginPage.expectLoaded();
      await loginPage.expectPasswordMasked();

      const email = process.env.TEST_USER_EMAIL ?? '';
      const password = process.env.TEST_USER_PASSWORD ?? '';

      await loginPage.login(email, password);
      await page.waitForURL(/\/dashboard/i);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.expectLoaded();
    });
  });

  import { Page, Locator, expect } from '@playwright/test';

  export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly errorMessage: Locator;
    readonly pageHeading: Locator;

    constructor(page: Page) {
      this.page = page;
      this.emailInput = page.getByLabel(/email/i);
      this.passwordInput = page.getByLabel(/password/i);
      this.loginButton = page.getByRole('button', { name: /log in|sign in|login/i });
      this.errorMessage = page.getByRole('alert');
      this.pageHeading = page.getByRole('heading', { name: /log in|sign in|login/i });
    }

    async navigate(): Promise<void> {
      await this.page.goto('/login');
      await this.expectLoaded();
    }

    async expectLoaded(): Promise<void> {
      await expect(this.pageHeading).toBeVisible();
      await expect(this.emailInput).toBeVisible();
      await expect(this.passwordInput).toBeVisible();
      await expect(this.loginButton).toBeVisible();
    }

    async login(email: string, password: string): Promise<void> {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
    }

    async expectPasswordMasked(): Promise<void> {
      await expect(this.passwordInput).toHaveAttribute('type', 'password');
    }

    async expectErrorMessage(message: string | RegExp): Promise<void> {
      await expect(this.errorMessage).toBeVisible();
      await expect(this.errorMessage).toContainText(message);
    }

    async expectFieldsRequired(): Promise<void> {
      await expect(this.emailInput).toHaveAttribute('required');
      await expect(this.passwordInput).toHaveAttribute('required');
    }
  }

  test('should successfully login with registered email and correct password', { tag: ['@functional', '@critical', '@login'] }, async ({ page }) => {
    // Navigate to login page
    await page.goto('/');

    // Enter registered email
    await page.fill('input[type="email"], input[name="email"], #email', process.env.TEST_USER_EMAIL!);

    // Enter correct password
    await page.fill('input[type="password"], input[name="password"], #password', process.env.TEST_USER_PASSWORD!);

    // Click login button
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), #login-button');

    // Verify user is redirected to dashboard landing page
    await page.waitForURL(/\/dashboard/i);

    // Additional assertion to verify dashboard content is loaded
    await page.waitForSelector('body');
    expect(page.url()).toMatch(/\/dashboard/i);
  });

  import { Page, Locator, expect } from '@playwright/test';

  export class DashboardPage {
    readonly page: Page;
    readonly pageHeading: Locator;
    readonly welcomeMessage: Locator;
    readonly userProfile: Locator;

    constructor(page: Page) {
      this.page = page;
      this.pageHeading = page.getByRole('heading', { name: /dashboard|welcome/i });
      this.welcomeMessage = page.getByText(/welcome|dashboard/i);
      this.userProfile = page.getByRole('button', { name: /profile|account|user/i });
    }

    async expectLoaded(): Promise<void> {
      await expect(this.pageHeading).toBeVisible();
      await expect(this.page).toHaveURL(/\/dashboard/i);
    }

    async expectUserLoggedIn(): Promise<void> {
      await this.expectLoaded();
      await expect(this.welcomeMessage).toBeVisible();
    }
  }

  test('Failed login with incorrect email or password', { tag: ['@functional', '@high-priority', '@login'] }, async ({ page }) => {
    // Navigate to login page
    await page.goto('/');

    // Enter incorrect email and password
    await page.fill('[data-testid="email-input"], input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"], input[type="password"], input[name="password"]', 'wrongpassword');

    // Click login button
    await page.click('[data-testid="login-button"], button[type="submit"], input[type="submit"]');

    // Wait for and verify error message is displayed
    const errorMessage = page.locator('[data-testid="error-message"], .error-message, .alert-error');
    await errorMessage.waitFor({ state: 'visible' });

    // Verify the error message content
    await expect(errorMessage).toContainText(/invalid email or password/i);

    // Verify user remains on login page (not redirected)
    await expect(page).toHaveURL(/\/login|\/$/);
  });
});
