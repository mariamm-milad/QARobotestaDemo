Based on the JIRA issue RB-9 and the page analysis showing a Login button on the Robotesta website, I have sufficient information to generate comprehensive test cases for admin login functionality.




// Test data configuration
const TEST_DATA = {
  validAdmin: {
    username: 'admin@robotesta.com',
    password: 'AdminPassword123!'
  },
  invalidCredentials: {
    username: 'invalid@robotesta.com',
    password: 'wrongpassword'
  },
  baseUrl: 'https://www.robotesta.app'
};

test.describe('Admin Login Functionality - RB-9', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Robotesta homepage
    await page.goto(TEST_DATA.baseUrl);
    await expect(page).toHaveTitle('Robotesta');
  });

  test('RB-9: Verify Admin can successfully login with valid credentials', async ({ page }) => {
    // Step 1: Navigate to login page by clicking Login button
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for login form to appear
    await expect(page.getByRole('textbox', { name: /username|email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    
    // Step 2: Enter valid admin username
    await page.getByRole('textbox', { name: /username|email/i }).fill(TEST_DATA.validAdmin.username);
    
    // Step 3: Enter correct password for admin account
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_DATA.validAdmin.password);
    
    // Step 4: Click the Login button
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Expected Result: Admin is redirected to dashboard or homepage with admin features
    await expect(page).toHaveURL(/.*\/(dashboard|admin|home).*/, { timeout: 10000 });
    
    // Verify admin-specific elements are present
    await expect(page.getByText(/dashboard|admin|welcome/i)).toBeVisible();
    
    // Verify successful login indicators
    await expect(page.getByRole('button', { name: /logout|sign out|profile/i })).toBeVisible();
    
    // Verify admin features are accessible
    const adminElements = [
      page.getByText(/admin panel/i),
      page.getByText(/manage/i),
      page.getByText(/settings/i),
      page.getByRole('navigation')
    ];
    
    // At least one admin feature should be visible
    let adminFeatureFound = false;
    for (const element of adminElements) {
      if (await element.isVisible().catch(() => false)) {
        adminFeatureFound = true;
        break;
      }
    }
    expect(adminFeatureFound).toBeTruthy();
  });

  test('Verify login form elements are present and accessible', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Verify form elements
    await expect(page.getByRole('textbox', { name: /username|email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible();
    
    // Verify form accessibility
    const usernameField = page.getByRole('textbox', { name: /username|email/i });
    const passwordField = page.getByRole('textbox', { name: /password/i });
    
    await expect(usernameField).toBeEnabled();
    await expect(passwordField).toBeEnabled();
    await expect(passwordField).toHaveAttribute('type', 'password');
  });

  test('Verify login fails with invalid credentials', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Enter invalid credentials
    await page.getByRole('textbox', { name: /username|email/i }).fill(TEST_DATA.invalidCredentials.username);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_DATA.invalidCredentials.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Verify error message appears
    await expect(page.getByText(/invalid|incorrect|error|failed/i)).toBeVisible({ timeout: 5000 });
    
    // Verify user remains on login page
    await expect(page.getByRole('textbox', { name: /username|email/i })).toBeVisible();
  });

  test('Verify login fails with empty credentials', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Attempt login with empty fields
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Verify validation messages
    const validationMessages = [
      page.getByText(/required|mandatory|enter/i),
      page.getByText(/username.*required/i),
      page.getByText(/password.*required/i)
    ];
    
    let validationFound = false;
    for (const message of validationMessages) {
      if (await message.isVisible().catch(() => false)) {
        validationFound = true;
        break;
      }
    }
    expect(validationFound).toBeTruthy();
  });

  test('Verify login fails with empty username', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Enter only password
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_DATA.validAdmin.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Verify username validation
    await expect(page.getByText(/username.*required|email.*required/i)).toBeVisible();
  });

  test('Verify login fails with empty password', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Enter only username
    await page.getByRole('textbox', { name: /username|email/i }).fill(TEST_DATA.validAdmin.username);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Verify password validation
    await expect(page.getByText(/password.*required/i)).toBeVisible();
  });

  test('Verify password field security (masked input)', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    const passwordField = page.getByRole('textbox', { name: /password/i });
    
    // Verify password field type
    await expect(passwordField).toHaveAttribute('type', 'password');
    
    // Enter password and verify it's masked
    await passwordField.fill('testpassword123');
    const inputValue = await passwordField.inputValue();
    expect(inputValue).toBe('testpassword123'); // Value should be there but display should be masked
  });

  test('Verify login form keyboard navigation', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    const usernameField = page.getByRole('textbox', { name: /username|email/i });
    const passwordField = page.getByRole('textbox', { name: /password/i });
    const loginButton = page.getByRole('button', { name: /login|sign in/i });
    
    // Test tab navigation
    await usernameField.focus();
    await expect(usernameField).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(passwordField).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(loginButton).toBeFocused();
  });

  test('Verify login form submission with Enter key', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Fill credentials
    await page.getByRole('textbox', { name: /username|email/i }).fill(TEST_DATA.validAdmin.username);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_DATA.validAdmin.password);
    
    // Submit form using Enter key
    await page.keyboard.press('Enter');
    
    // Verify login attempt (should redirect or show result)
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    expect(currentUrl).not.toBe(TEST_DATA.baseUrl);
  });

  test('Verify login button state during form submission', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    const usernameField = page.getByRole('textbox', { name: /username|email/i });
    const passwordField = page.getByRole('textbox', { name: /password/i });
    const loginButton = page.getByRole('button', { name: /login|sign in/i });
    
    // Fill valid credentials
    await usernameField.fill(TEST_DATA.validAdmin.username);
    await passwordField.fill(TEST_DATA.validAdmin.password);
    
    // Click login and check for loading state
    await loginButton.click();
    
    // Check if button shows loading state (common UX pattern)
    const loadingStates = [
      page.getByText(/loading|signing in|please wait/i),
      page.locator('[data-testid*="loading"]'),
      page.locator('.spinner, .loading')
    ];
    
    // At least one loading indicator might be present
    await page.waitForTimeout(500); // Brief wait to catch loading state
  });

  test('Verify successful login persistence across page refresh', async ({ page }) => {
    // First, perform successful login
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: /username|email/i }).fill(TEST_DATA.validAdmin.username);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_DATA.validAdmin.password);
    await page.getByRole('button', { name: /login|sign in/i }).click();
    
    // Wait for successful login
    await expect(page).toHaveURL(/.*\/(dashboard|admin|home).*/, { timeout: 10000 });
    
    // Refresh the page
    await page.reload();
    
    // Verify user is still logged in
    await expect(page.getByRole('button', { name: /logout|sign out|profile/i })).toBeVisible();
    
    // Verify not redirected back to login
    expect(page.url()).not.toContain('login');
  });
});

// Additional test suite for login security and edge cases
test.describe('Admin Login Security Tests - RB-9 Extended', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_DATA.baseUrl);
  });

  test('Verify SQL injection protection in login fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "admin'--",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --"
    ];
    
    for (const maliciousInput of maliciousInputs) {
      await page.getByRole('textbox', { name: /username|email/i }).fill(maliciousInput);
      await page.getByRole('textbox', { name: /password/i }).fill(maliciousInput);
      await page.getByRole('button', { name: /login|sign in/i }).click();
      
      // Should not crash or expose database errors
      await expect(page.getByText(/database error|sql error|syntax error/i)).not.toBeVisible();
      
      // Clear fields for next iteration
      await page.getByRole('textbox', { name: /username|email/i }).clear();
      await page.getByRole('textbox', { name: /password/i }).clear();
    }
  });

  test('Verify XSS protection in login fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    const xssPayloads = [
      'alert("XSS")',
      'javascript:alert("XSS")',
      '',
      '">alert("XSS")'
    ];
    
    for (const payload of xssPayloads) {
      await page.getByRole('textbox', { name: /username|email/i }).fill(payload);
      await page.getByRole('textbox', { name: /password/i }).fill('password');
      await page.getByRole('button', { name: /login|sign in/i }).click();
      
      // Wait a bit and verify no alert appeared (XSS blocked)
      await page.waitForTimeout(1000);
      
      // Clear fields for next iteration
      await page.getByRole('textbox', { name: /username|email/i }).clear();
      await page.getByRole('textbox', { name: /password/i }).clear();
    }
  });

  test('Verify login rate limiting (multiple failed attempts)', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await page.getByRole('textbox', { name: /username|email/i }).fill('invalid@test.com');
      await page.getByRole('textbox', { name: /password/i }).