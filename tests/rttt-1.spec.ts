import { test, expect } from '@playwright/test';

test.describe('RTTT-1', () => {
  import { test, expect } from '@playwright/test';
  import { LoginPage } from '../page-objects/login-page';
  import { DashboardPage } from '../page-objects/dashboard-page';

  test.describe('Login Page - Authentication', { tag: ['@auth', '@rttt-1'] }, () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    test.afterEach(async ({ page }, testInfo) => {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });

    test('should display mandatory email and password input fields', { tag: ['@smoke', '@ui'] }, async ({ page }) => {
      await expect(loginPage.getEmailInput()).toBeVisible();
      await expect(loginPage.getPasswordInput()).toBeVisible();
      await expect(loginPage.getLoginButton()).toBeVisible();
      await loginPage.expectRequiredFields();
    });

    test('should mask password input for security', { tag: ['@security'] }, async ({ page }) => {
      await loginPage.expectPasswordMasked();
      await loginPage.fillPassword('testpassword123');
      await expect(loginPage.getPasswordInput()).toHaveAttribute('type', 'password');
    });

    test('should login successfully with valid credentials and redirect to dashboard', { tag: ['@smoke', '@positive'] }, async ({ page }) => {
      test.setTimeout(30_000);
      const email = process.env.TEST_USER_EMAIL ?? '';
      const password = process.env.TEST_USER_PASSWORD ?? '';

      await loginPage.login(email, password);
      await page.waitForURL(/\/dashboard/i);

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.expectUserLoggedIn();
    });

    test('should display error message for invalid email format', { tag: ['@negative', '@validation'] }, async ({ page }) => {
      await loginPage.login('invalid-email', 'password123');
      await loginPage.expectErrorMessage();
    });

    test('should display error message for unregistered email', { tag: ['@negative'] }, async ({ page }) => {
      await loginPage.login('nonexistent@example.com', 'password123');
      await loginPage.expectErrorMessage();
    });

    test('should display error message for incorrect password', { tag: ['@negative'] }, async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL ?? '';
      await loginPage.login(email, 'wrongpassword');
      await loginPage.expectErrorMessage();
    });

    test('should display error message for empty email field', { tag: ['@negative', '@validation'] }, async ({ page }) => {
      await loginPage.login('', 'password123');
      await loginPage.expectErrorMessage();
    });

    test('should display error message for empty password field', { tag: ['@negative', '@validation'] }, async ({ page }) => {
      await loginPage.login('user@example.com', '');
      await loginPage.expectErrorMessage();
    });

    test('should display error message when both fields are empty', { tag: ['@negative', '@validation'] }, async ({ page }) => {
      await loginPage.clickLogin();
      await loginPage.expectErrorMessage();
    });

    test('should handle SQL injection attempt in email field', { tag: ['@security', '@negative'] }, async ({ page }) => {
      await loginPage.login("admin'; DROP TABLE users; --", 'password123');
      await loginPage.expectErrorMessage();
    });

    test('should handle XSS attempt in password field', { tag: ['@security', '@negative'] }, async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL ?? '';
      await loginPage.login(email, '<script>alert("xss")</script>');
      await loginPage.expectErrorMessage();
    });

    test('should prevent multiple rapid login attempts', { tag: ['@security', '@rate-limiting'] }, async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL ?? '';

      for (let i = 0; i < 5; i++) {
        await loginPage.login(email, 'wrongpassword');
        await loginPage.expectErrorMessage();
        await page.reload();
        await loginPage.expectLoaded();
      }

      await loginPage.login(email, 'wrongpassword');
      await expect(page.getByText(/too many attempts|rate limit|blocked/i)).toBeVisible();
    });
  });

  test.describe('Login Page - Cross-Browser Compatibility', { tag: ['@cross-browser', '@rttt-1'] }, () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    test.afterEach(async ({ page }, testInfo) => {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });

    test('should maintain consistent UI layout across browsers', { tag: ['@ui', '@responsive'] }, async ({ page }) => {
      await expect(loginPage.getEmailInput()).toBeVisible();
      await expect(loginPage.getPasswordInput()).toBeVisible();
      await expect(loginPage.getLoginButton()).toBeVisible();

      const emailBox = await loginPage.getEmailInput().boundingBox();
      const passwordBox = await loginPage.getPasswordInput().boundingBox();
      const buttonBox = await loginPage.getLoginButton().boundingBox();

      expect(emailBox).toBeTruthy();
      expect(passwordBox).toBeTruthy();
      expect(buttonBox).toBeTruthy();
      expect(emailBox!.width).toBeGreaterThan(200);
      expect(passwordBox!.width).toBeGreaterThan(200);
    });

    test('should handle keyboard navigation consistently', { tag: ['@accessibility', '@keyboard'] }, async ({ page }) => {
      await loginPage.getEmailInput().focus();
      await expect(loginPage.getEmailInput()).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(loginPage.getPasswordInput()).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(loginPage.getLoginButton()).toBeFocused();
    });

    test('should support form submission via Enter key', { tag: ['@keyboard', '@positive'] }, async ({ page }) => {
      test.setTimeout(30_000);
      const email = process.env.TEST_USER_EMAIL ?? '';
      const password = process.env.TEST_USER_PASSWORD ?? '';

      await loginPage.fillEmail(email);
      await loginPage.fillPassword(password);
      await page.keyboard.press('Enter');

      await page.waitForURL(/\/dashboard/i);
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.expectLoaded();
    });
  });

  import { Page, Locator, expect } from '@playwright/test';

  export class LoginPage {
    private page: Page;
    private emailInput: Locator;
    private passwordInput: Locator;
    private loginButton: Locator;
    private errorMessage: Locator;
    private loginHeading: Locator;

    constructor(page: Page) {
      this.page = page;
      this.emailInput = page.getByLabel(/email/i);
      this.passwordInput = page.getByLabel(/password/i);
      this.loginButton = page.getByRole('button', { name: /log in|sign in/i });
      this.errorMessage = page.getByRole('alert');
      this.loginHeading = page.getByRole('heading', { name: /log in|sign in/i });
    }

    async goto(): Promise<void> {
      await this.page.goto('/login');
      await this.expectLoaded();
    }

    async expectLoaded(): Promise<void> {
      await expect(this.loginHeading).toBeVisible();
      await expect(this.emailInput).toBeVisible();
      await expect(this.passwordInput).toBeVisible();
      await expect(this.loginButton).toBeVisible();
    }

    async fillEmail(email: string): Promise<void> {
      await this.emailInput.fill(email);
    }

    async fillPassword(password: string): Promise<void> {
      await this.passwordInput.fill(password);
    }

    async clickLogin(): Promise<void> {
      await this.loginButton.click();
    }

    async login(email: string, password: string): Promise<void> {
      await this.fillEmail(email);
      await this.fillPassword(password);
      await this.clickLogin();
    }

    async expectErrorMessage(message?: string): Promise<void> {
      await expect(this.errorMessage).toBeVisible();
      if (message) {
        await expect(this.errorMessage).toContainText(message);
      }
    }

    async expectPasswordMasked(): Promise<void> {
      await expect(this.passwordInput).toHaveAttribute('type', 'password');
    }

    async expectRequiredFields(): Promise<void> {
      await expect(this.emailInput).toHaveAttribute('required');
      await expect(this.passwordInput).toHaveAttribute('required');
    }

    getEmailInput(): Locator {
      return this.emailInput;
    }

    getPasswordInput(): Locator {
      return this.passwordInput;
    }

    getLoginButton(): Locator {
      return this.loginButton;
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
    private page: Page;
    private dashboardHeading: Locator;
    private userProfile: Locator;

    constructor(page: Page) {
      this.page = page;
      this.dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
      this.userProfile = page.getByRole('button', { name: /profile|account|user/i });
    }

    async expectLoaded(): Promise<void> {
      await expect(this.page).toHaveURL(/\/dashboard/i);
      await expect(this.dashboardHeading).toBeVisible();
    }

    async expectUserLoggedIn(): Promise<void> {
      await this.expectLoaded();
      await expect(this.userProfile).toBeVisible();
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
