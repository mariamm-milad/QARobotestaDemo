import { test, expect } from '@playwright/test';

test.describe('RTTT-1', () => {
  import { Page, Locator, expect } from '@playwright/test';

  export class DashboardPage {
    readonly page: Page;
    readonly dashboardHeading: Locator;
    readonly userProfile: Locator;
    readonly logoutButton: Locator;

    constructor(page: Page) {
      this.page = page;
      this.dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
      this.userProfile = page.getByRole('button', { name: /profile|user/i });
      this.logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    }

    async waitForDashboardLoad(): Promise<void> {
      await this.page.waitForURL(/.*dashboard.*/i);
      await expect(this.dashboardHeading).toBeVisible();
    }

    async isDashboardVisible(): Promise<boolean> {
      return await this.dashboardHeading.isVisible();
    }

    async logout(): Promise<void> {
      await this.userProfile.click();
      await this.logoutButton.click();
    }
  }

  import { test, expect } from '@playwright/test';
  import { LoginPage } from '../pages/LoginPage';
  import { DashboardPage } from '../pages/DashboardPage';

  test.describe('Login Page - Authentication with Page Object Model', { tag: ['@auth', '@pom'] }, () => {
    let loginPage: LoginPage;
    let dashboardPage: DashboardPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      dashboardPage = new DashboardPage(page);
      await loginPage.navigate();
    });

    test.afterEach(async ({ page }, testInfo) => {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });

    test.describe('Login Form Validation', () => {
      test('should display mandatory email and password input fields', { tag: ['@smoke'] }, async () => {
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();

        const isEmailRequired = await loginPage.isEmailFieldRequired();
        const isPasswordRequired = await loginPage.isPasswordFieldRequired();

        expect(isEmailRequired).toBe(true);
        expect(isPasswordRequired).toBe(true);
      });

      test('should mask password input for security', { tag: ['@security'] }, async () => {
        const isPasswordMasked = await loginPage.isPasswordMasked();
        expect(isPasswordMasked).toBe(true);

        await loginPage.passwordInput.fill('testpassword123');
        const inputValue = await loginPage.passwordInput.inputValue();
        expect(inputValue).toBe('testpassword123');
      });

      test('should validate email format', { tag: ['@validation'] }, async () => {
        await loginPage.emailInput.fill('invalid-email');
        await loginPage.passwordInput.fill('password123');
        await loginPage.loginButton.click();

        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(/invalid.*email|email.*format/i);
      });

      test('should require both email and password fields', { tag: ['@validation'] }, async () => {
        await loginPage.loginButton.click();

        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(/required|mandatory|fill.*field/i);
      });
    });

    test.describe('Successful Login', () => {
      test('should login with valid credentials and redirect to dashboard', { tag: ['@smoke', '@happy-path'] }, async () => {
        test.setTimeout(30_000);

        const email = process.env.TEST_USER_EMAIL ?? '';
        const password = process.env.TEST_USER_PASSWORD ?? '';

        await loginPage.login(email, password);
        await dashboardPage.waitForDashboardLoad();

        const isDashboardVisible = await dashboardPage.isDashboardVisible();
        expect(isDashboardVisible).toBe(true);
      });

      test('should login with remember me option', { tag: ['@functionality'] }, async () => {
        test.setTimeout(30_000);

        const email = process.env.TEST_USER_EMAIL ?? '';
        const password = process.env.TEST_USER_PASSWORD ?? '';

        await loginPage.loginWithRememberMe(email, password);
        await dashboardPage.waitForDashboardLoad();

        const isDashboardVisible = await dashboardPage.isDashboardVisible();
        expect(isDashboardVisible).toBe(true);
      });
    });

    test.describe('Failed Login Scenarios', () => {
      test('should display error for invalid credentials', { tag: ['@negative'] }, async () => {
        await loginPage.login('invalid@example.com', 'wrongpassword');

        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(/invalid.*credentials|incorrect.*password|login.*failed/i);
      });

      test('should display error for non-existent user', { tag: ['@negative'] }, async () => {
        await loginPage.login('nonexistent@example.com', 'password123');

        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(/user.*not.*found|account.*does.*not.*exist|invalid.*credentials/i);
      });

      test('should display error for empty password', { tag: ['@negative'] }, async () => {
        await loginPage.login('user@example.com', '');

        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(/password.*required|enter.*password/i);
      });

      test('should display error for empty email', { tag: ['@negative'] }, async () => {
        await loginPage.login('', 'password123');

        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toMatch(/email.*required|enter.*email/i);
      });
    });

    test.describe('UI Interactions', () => {
      test('should enable login button when fields are filled', { tag: ['@ui'] }, async () => {
        await loginPage.emailInput.fill('test@example.com');
        await loginPage.passwordInput.fill('password123');

        const isButtonEnabled = await loginPage.isLoginButtonEnabled();
        expect(isButtonEnabled).toBe(true);
      });

      test('should handle remember me checkbox interaction', { tag: ['@ui'] }, async () => {
        await expect(loginPage.rememberMeCheckbox).toBeVisible();
        await loginPage.rememberMeCheckbox.check();
        await expect(loginPage.rememberMeCheckbox).toBeChecked();

        await loginPage.rememberMeCheckbox.uncheck();
        await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
      });
    });
  });

  import { Page, Locator, expect } from '@playwright/test';

  export class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly rememberMeCheckbox: Locator;
    readonly errorMessage: Locator;
    readonly forgotPasswordLink: Locator;

    constructor(page: Page) {
      this.page = page;
      this.emailInput = page.getByLabel('Email');
      this.passwordInput = page.getByLabel('Password');
      this.loginButton = page.getByRole('button', { name: /login|sign in/i });
      this.rememberMeCheckbox = page.getByRole('checkbox', { name: /remember me/i });
      this.errorMessage = page.getByRole('alert');
      this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    }

    async navigate(): Promise<void> {
      await this.page.goto('https://robotesta.ai/login');
      await this.page.waitForLoadState('networkidle');
    }

    async login(email: string, password: string): Promise<void> {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
    }

    async loginWithRememberMe(email: string, password: string): Promise<void> {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.rememberMeCheckbox.check();
      await this.loginButton.click();
    }

    async isEmailFieldVisible(): Promise<boolean> {
      return await this.emailInput.isVisible();
    }

    async isPasswordFieldVisible(): Promise<boolean> {
      return await this.passwordInput.isVisible();
    }

    async isPasswordMasked(): Promise<boolean> {
      const inputType = await this.passwordInput.getAttribute('type');
      return inputType === 'password';
    }

    async isLoginButtonEnabled(): Promise<boolean> {
      return await this.loginButton.isEnabled();
    }

    async getErrorMessage(): Promise<string> {
      await expect(this.errorMessage).toBeVisible();
      return await this.errorMessage.textContent() || '';
    }

    async isEmailFieldRequired(): Promise<boolean> {
      const required = await this.emailInput.getAttribute('required');
      return required !== null;
    }

    async isPasswordFieldRequired(): Promise<boolean> {
      const required = await this.passwordInput.getAttribute('required');
      return required !== null;
    }
  }

  import { test, expect, devices } from '@playwright/test';
  import { LoginPage } from '../pages/LoginPage';
  import { DashboardPage } from '../pages/DashboardPage';

  const browsers = ['chromium', 'firefox', 'webkit'];
  const mobileDevices = ['iPhone 13', 'Pixel 5'];

  test.describe('Cross-Browser Login Compatibility', { tag: ['@cross-browser', '@compatibility'] }, () => {
    let loginPage: LoginPage;
    let dashboardPage: DashboardPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      dashboardPage = new DashboardPage(page);
    });

    test.afterEach(async ({ page }, testInfo) => {
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('screenshot', { body: await page.screenshot(), contentType: 'image/png' });
      }
    });

    test('should work consistently across desktop browsers', { tag: ['@desktop'] }, async ({ page, browserName }) => {
      test.setTimeout(45_000);

      await loginPage.navigate();

      // Verify form elements are visible and functional
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();

      // Test password masking works across browsers
      const isPasswordMasked = await loginPage.isPasswordMasked();
      expect(isPasswordMasked).toBe(true);

      // Test login functionality
      const email = process.env.TEST_USER_EMAIL ?? '';
      const password = process.env.TEST_USER_PASSWORD ?? '';

      await loginPage.login(email, password);
      await dashboardPage.waitForDashboardLoad();

      const isDashboardVisible = await dashboardPage.isDashboardVisible();
      expect(isDashboardVisible).toBe(true);
    });

    mobileDevices.forEach(deviceName => {
      test(`should work on mobile device: ${deviceName}`, { tag: ['@mobile'] }, async ({ browser }) => {
        test.setTimeout(45_000);

        const device = devices[deviceName];
        const context = await browser.newContext({
          ...device,
        });
        const page = await context.newPage();

        const mobileLoginPage = new LoginPage(page);
        const mobileDashboardPage = new DashboardPage(page);

        try {
          await mobileLoginPage.navigate();

          // Verify mobile responsiveness
          await expect(mobileLoginPage.emailInput).toBeVisible();
          await expect(mobileLoginPage.passwordInput).toBeVisible();
          await expect(mobileLoginPage.loginButton).toBeVisible();

          // Test touch interactions
          const email = process.env.TEST_USER_EMAIL ?? '';
          const password = process.env.TEST_USER_PASSWORD ?? '';

          await mobileLoginPage.emailInput.tap();
          await mobileLoginPage.emailInput.fill(email);

          await mobileLoginPage.passwordInput.tap();
          await mobileLoginPage.passwordInput.fill(password);

          await mobileLoginPage.loginButton.tap();
          await mobileDashboardPage.waitForDashboardLoad();

          const isDashboardVisible = await mobileDashboardPage.isDashboardVisible();
          expect(isDashboardVisible).toBe(true);
        } finally {
          await context.close();
        }
      });
    });
  });
});
