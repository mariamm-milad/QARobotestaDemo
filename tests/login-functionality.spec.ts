// RAB-8: Login functionality test suite
// Tests user authentication with email and password
import { test, expect } from '@playwright/test';

test.describe('Login Functionality - RAB-8', () => {
  const baseUrl = 'https://robotesta.ai.com';
  const validEmail = 'testuser@example.com';
  const validPassword = 'TestPassword123!';
  const invalidEmail = 'invalid@example.com';
  const invalidPassword = 'wrongpassword';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
    // Navigate to login page - adjust selector based on actual implementation
    await page.click('text=Login', { timeout: 10000 }).catch(() => {
      // Alternative selectors if 'Login' text is not found
      return page.click('[data-testid="login-button"]').catch(() => {
        return page.click('a[href*="login"]');
      });
    });
  });

  test('should display mandatory email and password input fields', async ({ page }) => {
    // Verify email input field exists and is mandatory
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]').first();
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('required', '');
    
    // Verify password input field exists and is mandatory
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id*="password"]').first();
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('required', '');
    
    // Verify field labels or placeholders
    await expect(page.locator('text=Email, text=email, [placeholder*="email" i]')).toBeVisible();
    await expect(page.locator('text=Password, text=password, [placeholder*="password" i]')).toBeVisible();
  });

  test('should verify password input is masked for security', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id*="password"]').first();
    
    // Verify password field type is 'password'
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Type password and verify it's masked
    await passwordInput.fill('TestPassword123');
    const inputValue = await passwordInput.inputValue();
    expect(inputValue).toBe('TestPassword123'); // Value should be stored
    
    // Verify the visual representation is masked (password dots)
    const computedStyle = await passwordInput.evaluate((el) => {
      return window.getComputedStyle(el).webkitTextSecurity || el.type;
    });
    expect(computedStyle).toBe('password');
  });

  test('should successfully login with valid credentials and redirect to dashboard', async ({ page }) => {
    // Fill in valid credentials
    await page.fill('input[type="email"], input[name="email"], input[id*="email"]', validEmail);
    await page.fill('input[type="password"], input[name="password"], input[id*="password"]', validPassword);
    
    // Submit login form
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for navigation and verify redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Verify dashboard elements are present
    await expect(page.locator('text=Dashboard, text=Welcome, [data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Verify successful login indicators
    await expect(page.locator('text=Logout, text=Profile, [data-testid="user-menu"]')).toBeVisible();
  });

  test('should display error message for invalid email', async ({ page }) => {
    // Fill in invalid email and valid password
    await page.fill('input[type="email"], input[name="email"], input[id*="email"]', invalidEmail);
    await page.fill('input[type="password"], input[name="password"], input[id*="password"]', validPassword);
    
    // Submit login form
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Verify error message is displayed
    const errorMessage = page.locator('.error, .alert-danger, [data-testid="error-message"], text="Invalid credentials"');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify user remains on login page
    await expect(page.url()).toContain('login');
  });

  test('should display error message for invalid password', async ({ page }) => {
    // Fill in valid email and invalid password
    await page.fill('input[type="email"], input[name="email"], input[id*="email"]', validEmail);
    await page.fill('input[type="password"], input[name="password"], input[id*="password"]', invalidPassword);
    
    // Submit login form
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Verify error message is displayed
    const errorMessage = page.locator('.error, .alert-danger, [data-testid="error-message"], text="Invalid credentials"');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify user remains on login page
    await expect(page.url()).toContain('login');
  });

  test('should display error message for empty credentials', async ({ page }) => {
    // Submit form without filling credentials
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Verify validation messages for required fields
    const emailValidation = page.locator('input[type="email"]:invalid, input[name="email"]:invalid');
    const passwordValidation = page.locator('input[type="password"]:invalid, input[name="password"]:invalid');
    
    await expect(emailValidation).toBeVisible();
    await expect(passwordValidation).toBeVisible();
    
    // Verify user remains on login page
    await expect(page.url()).toContain('login');
  });

  test('should handle malformed email addresses', async ({ page }) => {
    const malformedEmails = ['invalid-email', '@domain.com', 'user@', 'user.domain.com'];
    
    for (const email of malformedEmails) {
      await page.fill('input[type="email"], input[name="email"], input[id*="email"]', email);
      await page.fill('input[type="password"], input[name="password"], input[id*="password"]', validPassword);
      
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      
      // Verify email validation or error message
      const isEmailInvalid = await page.locator('input[type="email"]:invalid').isVisible();
      const hasErrorMessage = await page.locator('.error, .alert-danger, [data-testid="error-message"]').isVisible();
      
      expect(isEmailInvalid || hasErrorMessage).toBeTruthy();
      
      // Clear fields for next iteration
      await page.fill('input[type="email"], input[name="email"], input[id*="email"]', '');
      await page.fill('input[type="password"], input[name="password"], input[id*="password"]', '');
    }
  });

  test('should prevent SQL injection attempts', async ({ page }) => {
    const sqlInjectionAttempts = [
      "' OR '1'='1",
      "admin'--",
      "' OR 1=1--",
      "'; DROP TABLE users;--"
    ];
    
    for (const injection of sqlInjectionAttempts) {
      await page.fill('input[type="email"], input[name="email"], input[id*="email"]', injection);
      await page.fill('input[type="password"], input[name="password"], input[id*="password"]', injection);
      
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      
      // Verify login fails and shows appropriate error
      const errorMessage = page.locator('.error, .alert-danger, [data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      
      // Verify user remains on login page (not redirected)
      await expect(page.url()).toContain('login');
      
      // Clear fields for next iteration
      await page.fill('input[type="email"], input[name="email"], input[id*="email"]', '');
      await page.fill('input[type="password"], input[name="password"], input[id*="password"]', '');
    }
  });

  test('should maintain login state across page refresh', async ({ page }) => {
    // Login with valid credentials
    await page.fill('input[type="email"], input[name="email"], input[id*="email"]', validEmail);
    await page.fill('input[type="password"], input[name="password"], input[id*="password"]', validPassword);
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Refresh the page
    await page.reload();
    
    // Verify user is still logged in
    await expect(page.locator('text=Dashboard, text=Welcome, [data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Logout, text=Profile, [data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/login', route => route.abort());
    
    await page.fill('input[type="email"], input[name="email"], input[id*="email"]', validEmail);
    await page.fill('input[type="password"], input[name="password"], input[id*="password"]', validPassword);
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Verify appropriate error message for network issues
    const networkErrorMessage = page.locator('text="Network error", text="Connection failed", .error, .alert-danger');
    await expect(networkErrorMessage).toBeVisible({ timeout: 10000 });
  });
});

// Cross-browser compatibility tests
test.describe('Login Cross-Browser Compatibility - RAB-8', () => {
  const baseUrl = 'https://robotesta.ai.com';
  const validEmail = 'testuser@example.com';
  const validPassword = 'TestPassword123!';

  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work consistently on ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test on ${currentBrowser}`);
      
      await page.goto(baseUrl);
      
      // Navigate to login
      await page.click('text=Login, [data-testid="login-button"], a[href*="login"]').catch(() => {});
      
      // Verify form elements are present
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
      
      // Test login functionality
      await page.fill('input[type="email"], input[name="email"]', validEmail);
      await page.fill('input[type="password"], input[name="password"]', validPassword);
      await page.click('button[type="submit"], button:has-text("Login")');
      
      // Verify successful login works across browsers
      await expect(page.locator('text=Dashboard, [data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    });
  });
});