{
  "description": "Comprehensive test suite for RA-2 user invitation functionality covering all acceptance criteria with updated environment URL. Tests admin-only access, popup interactions, successful invitations, email validation, user list updates, and all popup closure methods with robust error handling and edge cases.",
  "generatedFiles": [
    {
      "fileName": "user-invitation-updated.spec.ts",
      "code": "// Test suite for RA-2: Admin User Invitation Functionality (Updated Environment)
import { test, expect } from '@playwright/test';

test.describe('User Invitation Functionality - RA-2 (Updated Environment)', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  // Helper function to login as admin
  async function loginAsAdmin() {
    await page.goto('https://robotesta.app/');
    await page.waitForLoadState('networkidle');
    
    // Handle different login scenarios
    await page.fill('input[name="email"], input[name="username"], #email, #username', 'admin@test.com');
    await page.fill('input[name="password"], #password', 'adminPassword123');
    await page.click('button[type="submit"], .login-btn, #login-button');
    
    // Wait for successful login and navigation
    await page.waitForURL(/dashboard|users|home/, { timeout: 10000 });
  }

  // Helper function to login as regular user
  async function loginAsRegularUser() {
    await page.goto('x');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"], input[name="username"], #email, #username', 'user@test.com');
    await page.fill('input[name="password"], #password', 'userPassword123');
    await page.click('button[type="submit"], .login-btn, #login-button');
    
    await page.waitForURL(/dashboard|home/, { timeout: 10000 });
  }

  // Helper function to navigate to Users page
  async function navigateToUsersPage() {
    // Multiple ways to navigate to users page
    const usersLink = page.locator('a[href*="users"], .nav-users, [data-menu="users"]').first();
    if (await usersLink.isVisible()) {
      await usersLink.click();
    } else {
      // Try menu dropdown
      await page.click('.menu-toggle, .hamburger, .nav-toggle');
      await page.click('a[href*="users"], .nav-users');
    }
    
    await page.waitForURL(/users/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  }

  test('AC1: Verify only admin users can see and access +Invite User button', async () => {
    await loginAsAdmin();
    await navigateToUsersPage();
    
    // Multiple selector strategies for invite button
    const inviteButton = page.locator(
      'button:has-text("+Invite User"), ' +
      'button:has-text("Invite User"), ' +
      '.invite-btn, ' +
      '[data-testid="invite-user-button"], ' +
      '#invite-user-btn'
    ).first();
    
    await expect(inviteButton).toBeVisible({ timeout: 10000 });
    await expect(inviteButton).toBeEnabled();
    
    // Verify button text contains invite
    const buttonText = await inviteButton.textContent();
    expect(buttonText?.toLowerCase()).toContain('invite');
  });

  test('AC1: Verify regular users cannot see +Invite User button', async () => {
    await loginAsRegularUser();
    await navigateToUsersPage();
    
    const inviteButton = page.locator(
      'button:has-text("+Invite User"), ' +
      'button:has-text("Invite User"), ' +
      '.invite-btn, ' +
      '[data-testid="invite-user-button"], ' +
      '#invite-user-btn'
    );
    
    await expect(inviteButton).not.toBeVisible();
  });

  test('AC2: Verify +Invite User button opens popup with correct fields', async () => {
    await loginAsAdmin();
    await navigateToUsersPage();
    
    // Click the invite user button
    const inviteButton = page.locator(
      'button:has-text("+Invite User"), ' +
      'button:has-text("Invite User"), ' +
      '.invite-btn'
    ).first();
    
    await inviteButton.click();
    
    // Verify popup is visible with multiple selector strategies
    const popup = page.locator(
      '.modal, .popup, .dialog, ' +
      '[role="dialog"], ' +
      '.invite-modal, ' +
      '#invite-popup'
    ).first();
    
    await expect(popup).toBeVisible({ timeout: 5000 });
    
    // Verify popup title
    const popupTitle = popup.locator('h1, h2, h3, .title, .modal-title');
    await expect(popupTitle).toContainText(/invite user/i);
    
    // Verify email text field
    const emailField = popup.locator(
      'input[type="email"], ' +
      'input[name="email"], ' +
      '.email-input, ' +
      '#email'
    ).first();
    
    await expect(emailField).toBeVisible();
    await expect(emailField).toBeEditable();
    
    // Verify role dropdown
    const roleDropdown = popup.locator(
      'select[name="role"], ' +
      '.role-select, ' +
      '#role, ' +
      'select:has(option[value="User"])'
    ).first();
    
    await expect(roleDropdown).toBeVisible();
    
    // Verify dropdown options
    await expect(roleDropdown.locator('option[value="User"], option:has-text("User")')).toBeVisible();
    await expect(roleDropdown.locator('option[value="Admin"], option:has-text("Admin")')).toBeVisible();
    
    // Verify popup buttons
    const okButton = popup.locator('button:has-text("Ok"), button:has-text("Send"), .ok-btn').first();
    const cancelButton = popup.locator('button:has-text("Cancel"), .cancel-btn').first();
    const closeButton = popup.locator('.close, .modal-close, button:has-text("×")').first();
    
    await expect(okButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
    await expect(closeButton).toBeVisible();
  });

  test('AC3: Verify successful invitation with User role', async () => {
    await loginAsAdmin();
    await navigateToUsersPage();
    
    // Get initial user count
    const userRows = page.locator('tbody tr, .user-row, .user-item');
    const initialUserCount = await userRows.count();
    
    // Open invite popup
    await page.locator('button:has-text("Invite")').first().click();
    
    const popup = page.locator('.modal, .popup, [role="dialog"]').first();
    await expect(popup).toBeVisible();
    
    // Fill in invitation details
    const testEmail = `newuser_${Date.now()}@test.com`;
    await popup.locator('input[type="email"], input[name="email"]').fill(testEmail);
    await popup.locator('select[name="role"], .role-select').selectOption('User');
    
    // Submit invitation
    await popup.locator('button:has-text("Ok"), button:has-text("Send")').click();
    
    // Verify confirmation message
    const confirmationMessage = page.locator(
      '.toast, .notification, .alert, .success-message, ' +
      ':has-text("successfully"), :has-text("sent")'
    );
    
    await expect(confirmationMessage).toBeVisible({ timeout: 10000 });
    
    // Verify popup is closed
    await expect(popup).not.toBeVisible();
    
    // Verify user appears in list with Pending status
    await page.waitForTimeout(2000); // Allow time for list update
    
    const newUserRow = page.locator(`tr:has-text("${testEmail}"), .user-item:has-text("${testEmail}")`);
    await expect(newUserRow).toBeVisible({ timeout: 10000 });
    
    // Verify status is Pending
    await expect(newUserRow).toContainText(/pending/i);
    await expect(newUserRow).toContainText(/user/i);
    
    // Verify user count increased
    const finalUserCount = await userRows.count();
    expect(finalUserCount).toBe(initialUserCount + 1);
  });

  test('AC3: Verify successful invitation with Admin role', async () => {
    await loginAsAdmin();
    await navigateToUsersPage();
    
    // Open invite popup
    await page.locator('button:has-text("Invite")').first().click();
    
    const popup = page.locator('.modal, .popup, [role="dialog"]').first();
    
    // Fill in invitation details
    const testEmail = `newadmin_${Date.now()}@test.com`;
    await popup.locator('input[type="email"]').fill(testEmail);
    await popup.locator('select[name="role"]').selectOption('Admin');
    
    // Submit invitation
    await popup.locator('button:has-text("Ok"), button:has-text("Send")').click();
    
    // Verify confirmation message
    await expect(page.locator('.toast, .notification, .success-message')).toBeVisible();
    
    // Verify user appears in list with correct role
    const newUserRow = page.locator(`tr:has-text("${testEmail}")`);
    await expect(newUserRow).toBeVisible({ timeout: 10000 });
    await expect(newUserRow).toContainText(/admin/i);
    await expect(newUserRow).toContainText(/pending/i);
  });

  test('AC4: Verify Cancel button does not change data or send emails', async () => {
    await loginAsAdmin();
    await navigateToUsersPage();
    
    // Get initial user count
    const initialUserCount = await page.locator('tbody tr, .user-row').count();
    
    // Open invite popup
    await page.locator('button:has-text("Invite")').first().click();
    
    const popup = page.locator('.modal, .popup, [role="dialog"]').first();
    
    // Fill in invitation details
    const testEmail = 'cancelled@test.com';
    await popup.locator('input[type="email"]').fill(testEmail);
    await popup.locator('select[name="role"]').selectOption('User');
    
    // Click Cancel button
    await popup.locator('button:has-text("Cancel")').click();
    
    // Verify popup is closed
    await expect(popup).not.toBeVisible();
    
    // Verify no confirmation message
    await expect(page.locator('.toast, .notification')).not.toBeVisible();
    
    // Verify user count unchanged
    const finalUserCount = await page.locator('tbody tr, .user-row').count();
    expect(finalUserCount).toBe(initialUserCount);
    
    // Verify user not in list
    const cancelledUserRow = page.locator(`tr:has-text("${testEmail}")`);
    await expect(cancelledUserRow).not.toBeVisible();
  });

  test('AC5: Verify popup can be closed by X icon', async () => {
    await loginAsAdmin();
    await navigateToUsersPage();
    
    await page.locator('button:has-text("Invite")').first().click();
    
    const popup = page.locator('.modal, .popup, [role="dialog"]').first();
    await expect(popup).toBeVisible();
    
    // Close by X icon
    await popup.locator('.close, .modal-close, button:has-text("×")').first().click();
    await expect(popup).not.toBeVisible();
  });

  test('AC5: Verify popup can be closed by Ok button (after filling form)', async () => {
    await loginAsAdmin();
    await navigateToUsersPage();
    
    await page.locator('button:has-text("Invite")').first().click();
    
    const popup = page.locator('.modal, .popup, [role="dialog"]').first();
    
    await popup.locator('input[type="email"]').fill('okbutton@test.com');
    await popup.locator('select[name="role"]').selectOption('User');
    
    // Close by Ok button
    await popup.locator('button:has-text("Ok"), button:has-text("Send")').click();
    await expect(popup).not.toBeVisible();
  });

  test('AC5: Verify popup can be closed by Cancel button', async () => {
    await loginAsAdmin();
    await navigateToUsersPage();
    
    await page.locator('button:has-text("Invite")').first().click();
    
    const popup = page.locator('.modal, .popup, [role="dialog"]').first();
    
    // Close by Cancel button
    await popup.locator('button:has-text("Cancel")').click();
    await expect(popup).not.toBeVisible();
  });

  test('AC5: Verify popup can be closed by clicking outside', async () => {
    await loginAsAdmin();
    await navigateToUsersPage();
    
    await page.locator('button:has-text("Invite")').first().click();
    
    const popup = page.locator('.modal, .popup, [role="dialog"]').first();
    await expect(popup).toBeVisible();
    
    // Click outside popup (on backdrop or body)
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    
    // Alternative: click on modal backdrop
    const backdrop = page.locator('.modal-backdrop,