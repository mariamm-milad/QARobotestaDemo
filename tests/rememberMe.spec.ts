import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

const LOGIN_URL = 'https://robotesta.app/login';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123';
const NEW_PASSWORD = 'NewPassword456';

// Helper function to perform login
async function performLogin(page: Page, email: string, password: string, rememberMe: boolean = false) {
  await page.goto(LOGIN_URL);
  await page.getByRole('textbox', { name: 'Enter emailaddress' }).fill(email);
  await page.getByRole('textbox', { name: 'Enter Password' }).fill(password);
  
  if (rememberMe) {
    await page.getByRole('checkbox', { name: 'Remember me' }).check();
  }
  
  // Wait for sign in button to be enabled and click
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  await page.getByRole('button', { name: 'Sign in' }).click();
}

// Helper function to check if user is authenticated
async function isUserAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto(LOGIN_URL);
    // If redirected away from login page, user is authenticated
    await page.waitForTimeout(2000);
    return !page.url().includes('/login');
  } catch {
    return false;
  }
}

// Helper function to logout user
async function performLogout(page: Page) {
  // Navigate to dashboard or main page first
  await page.goto('https://robotesta.app/dashboard');
  // Look for logout button/link and click it
  await page.getByRole('button', { name: /logout|sign out/i }).click();
}

test.describe('RAB-9: Remember Me Functionality', () => 
  {
  
  test.describe('AC1: Remember Me checkbox display and default state', () => {
    test('should display Remember Me checkbox unchecked by default', async ({ page }) => {
      await page.goto(LOGIN_URL);
      
      // Verify Remember Me checkbox is visible
      const rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember me' });
      await expect(rememberMeCheckbox).toBeVisible();
      
      // Verify checkbox is unchecked by default
      await expect(rememberMeCheckbox).not.toBeChecked();
      
      // Verify Remember Me label is visible
      await expect(page.getByText('Remember me')).toBeVisible();
    });
    
    test('should allow user to check and uncheck Remember Me checkbox', async ({ page }) => {
      await page.goto(LOGIN_URL);
      
      const rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember me' });
      
      // Check the checkbox
      await rememberMeCheckbox.check();
      await expect(rememberMeCheckbox).toBeChecked();
      
      // Uncheck the checkbox
      await rememberMeCheckbox.uncheck();
      await expect(rememberMeCheckbox).not.toBeChecked();
    });
  });
  
  test.describe('AC2: Remember Me with valid credentials - session persistence', () => {
    test('should keep user authenticated across browser sessions when Remember Me is selected', async ({ browser }) => {
      // Create first browser context
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      
      // Login with Remember Me checked
      await performLogin(await page1, TEST_EMAIL, TEST_PASSWORD, true);
      
      // Verify successful login
      await expect(page1).not.toHaveURL(LOGIN_URL);
      
      // Close first context to simulate browser session end
      await context1.close();
      
      // Create new browser context to simulate new session
      const context2 = await browser.newContext();
      const page2 = context2.newPage();
      
      // Navigate to login page - should be redirected if remembered
      const isAuthenticated = await isUserAuthenticated(await page2);
      expect(isAuthenticated).toBeTruthy();
      
      await context2.close();
    });
    
    test('should maintain authentication when navigating directly to protected pages', async ({ browser }) => {
      const context1 = await browser.newContext();
      const page1 = context1.newPage();
      
      // Login with Remember Me
      await performLogin(await page1, TEST_EMAIL, TEST_PASSWORD, true);
      await context1.close();
      
      // New session - try accessing protected page directly
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      await page2.goto('https://robotesta.app/dashboard');
      // Should not be redirected to login page
      await expect(page2).not.toHaveURL(LOGIN_URL);
      
      await context2.close();
    });
  });
  
  test.describe('AC3: Login without Remember Me - session not persisted', () => {
    test('should require re-authentication when Remember Me is not selected', async ({ browser }) => {
      // First session - login without Remember Me
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      
      await performLogin(await page1, TEST_EMAIL, TEST_PASSWORD, false);
      
      // Verify successful login
      await expect(page1).not.toHaveURL(LOGIN_URL);
      
      await context1.close();
      
      // New session - should require re-authentication
      const context2 = await browser.newContext();
      const page2 =await context2.newPage();
      
      const isAuthenticated = await isUserAuthenticated(await page2);
      expect(isAuthenticated).toBeFalsy();
      
      // Should be on login page
      await expect(page2).toHaveURL(LOGIN_URL);
      
      await context2.close();
    });
    
    test('should redirect to login when accessing protected pages without Remember Me', async ({ browser }) => {
      const context1 = await browser.newContext();
      const page1 = context1.newPage();
      
      // Login without Remember Me
      await performLogin(await page1, TEST_EMAIL, TEST_PASSWORD, false);
      await context1.close();
      
      // New session - try accessing protected page
      const context2 = await browser.newContext();
      const page2 =await context2.newPage();
      
      await page2.goto('https://robotesta.app/dashboard');
      // Should be redirected to login page
      await expect(page2).toHaveURL(LOGIN_URL);
      
      await context2.close();
    });
  });
  
  test.describe('AC4: Manual logout clears remembered session', () => {
    test('should clear remembered session when user logs out manually', async ({ browser }) => {
      // Login with Remember Me
      const context1 = await browser.newContext();
      const page1 =await context1.newPage();
      
      await performLogin(await page1, TEST_EMAIL, TEST_PASSWORD, true);
      
      // Perform manual logout
      await performLogout(await page1);
      
      // Verify redirected to login page
      await expect(page1).toHaveURL(LOGIN_URL);
      
      await context1.close();
      
      // New session - should require authentication despite previous Remember Me
      const context2 = await browser.newContext();
      const page2 = context2.newPage();
      
      const isAuthenticated = await isUserAuthenticated(await page2);
      expect(isAuthenticated).toBeFalsy();
      
      await context2.close();
    });
    
    test('should require credentials after logout even with Remember Me previously selected', async ({ browser }) => {
      const context1 = await browser.newContext();
      const page1 = context1.newPage();
      
      // Login with Remember Me and then logout
      await performLogin(await page1, TEST_EMAIL, TEST_PASSWORD, true);
      await performLogout(await page1);
      
      await context1.close();
      
      // New session - try to access protected resource
      const context2 = await browser.newContext();
      const page2 =await context2.newPage();
      
      await page2.goto('https://robotesta.app/dashboard');
      await expect(page2).toHaveURL(LOGIN_URL);
      
      // Verify login form is displayed and functional
      await expect(page2.getByRole('textbox', { name: 'Enter emailaddress' })).toBeVisible();
      await expect(page2.getByRole('textbox', { name: 'Enter Password' })).toBeVisible();
      
      await context2.close();
    });
  });
  
  test.describe('AC5: Password change requires re-authentication', () => {
    test('should require re-authentication after password change', async ({ browser }) => {
      // Login with Remember Me
      const context1 = await browser.newContext();
      const page1 =await context1.newPage();
      
      await performLogin(await page1, TEST_EMAIL, TEST_PASSWORD, true);
      
      // Navigate to profile/settings to change password
      await page1.goto('https://robotesta.app/profile');
      
      // Change password (assuming there's a change password form)
      await page1.getByRole('textbox', { name: /current password/i }).fill(TEST_PASSWORD);
      await page1.getByRole('textbox', { name: /new password/i }).fill(NEW_PASSWORD);
      await page1.getByRole('textbox', { name: /confirm password/i }).fill(NEW_PASSWORD);
      await page1.getByRole('button', { name: /change password|update password/i }).click();
      
      await context1.close();
      
      // New session - should require re-authentication despite Remember Me
      const context2 = await browser.newContext();
      const page2 =await context2.newPage();
      
      const isAuthenticated = await isUserAuthenticated(await page2);
      expect(isAuthenticated).toBeFalsy();
      
      // Should be able to login with new password
      await performLogin(await page2, TEST_EMAIL, NEW_PASSWORD, false);
      await expect(page2).not.toHaveURL(LOGIN_URL);
      
      await context2.close();
    });
  });
  
  test.describe('AC6: Cross-browser compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work consistently in ${browserName}`, async ({ browser }) => {
        test.skip(browser.browserType().name() !== browserName, `This test runs on ${browserName}`);
        
        const context = await browser.newContext();
        const page =await context.newPage();
        
        await page.goto(LOGIN_URL);
        
        // Test checkbox functionality
        const rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember me' });
        await expect(rememberMeCheckbox).toBeVisible();
        await expect(rememberMeCheckbox).not.toBeChecked();
        
        // Test checking the checkbox
        await rememberMeCheckbox.check();
        await expect(rememberMeCheckbox).toBeChecked();
        
        // Test login with Remember Me
        await performLogin(await page, TEST_EMAIL, TEST_PASSWORD, true);
        await expect(page).not.toHaveURL(LOGIN_URL);
        
        await context.close();
        
        // Test session persistence
        const newContext = await browser.newContext();
        const newPage = newContext.newPage();
        
        const isAuthenticated = await isUserAuthenticated(await newPage);
        expect(isAuthenticated).toBeTruthy();
        
        await newContext.close();
      });
    });
  });
  
  test.describe('Edge Cases and Error Scenarios', () => {
    test('should handle Remember Me with invalid credentials gracefully', async ({ page }) => {
      await page.goto(LOGIN_URL);
      
      // Check Remember Me and try to login with invalid credentials
      await page.getByRole('textbox', { name: 'Enter emailaddress' }).fill('invalid@email.com');
      await page.getByRole('textbox', { name: 'Enter Password' }).fill('wrongpassword');
      await page.getByRole('checkbox', { name: 'Remember me' }).check();
      
      await page.getByRole('button', { name: 'Sign in' }).click();
      
      // Should remain on login page with error message
      await expect(page).toHaveURL(LOGIN_URL);
      await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible();
      
      // Remember Me checkbox should still be checked
      await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();
    });
    
    test('should handle session expiry gracefully with Remember Me', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Login with Remember Me
      await performLogin(await page, TEST_EMAIL, TEST_PASSWORD, true);
      
      // Simulate session expiry by clearing cookies
      await context.clearCookies();
      
      // Try to access protected page
      await page.goto('https://robotesta.app/dashboard');
      
      // Should be redirected to login page
      await expect(page).toHaveURL(LOGIN_URL);
      
      await context.close();
    });
    
    test('should maintain Remember Me state during form validation errors', async ({ page }) => {
      await page.goto(LOGIN_URL);
      
      // Check Remember Me
      await page.getByRole('checkbox', { name: 'Remember me' }).check();
      
      // Try to submit with empty fields
      await page.getByRole('button', { name: 'Sign in' }).click();
      
      // Remember Me should still be checked after validation error
      await expect(page.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();
    });

    });
    });
    
