// RAB-113: AI Code Update and Refinement Tests
import { test, expect } from '@playwright/test';

const baseUrl = 'https://testenv.com';

test.describe('AI Code Updates and Refinements - RAB-113', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);

    // Navigate to Generate AI Code page
    await page.click('[data-testid="generate-ai-code"]');
    await expect(page).toHaveURL(/.*generate-ai-code.*/);
  });

  test('should keep chat input available after initial code generation', async ({ page }) => {

    await page.fill('[data-testid="code-prompt-input"]', 'Create a simple login test');
    await page.click('[data-testid="generate-code-btn"]');

    await expect(page.locator('[data-testid="generated-code-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-code-content"]')).toContainText('test');

    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-input"]')).toBeEnabled();
    await expect(page.locator('[data-testid="chat-submit-btn"]')).toBeVisible();
  });

  test('should allow user to submit update request', async ({ page }) => {

    await page.fill('[data-testid="code-prompt-input"]', 'Create a basic form validation test');
    await page.click('[data-testid="generate-code-btn"]');

    await expect(page.locator('[data-testid="generated-code-widget"]')).toBeVisible();

    const updateRequest = 'Add error handling and retry logic to the test';

    await page.fill('[data-testid="chat-input"]', updateRequest);
    await page.click('[data-testid="chat-submit-btn"]');

    await expect(page.locator('[data-testid="chat-message"]').last()).toContainText(updateRequest);
    await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
  });

  test('should display updated code in separate widget', async ({ page }) => {

    await page.fill('[data-testid="code-prompt-input"]', 'Create a navigation test');
    await page.click('[data-testid="generate-code-btn"]');

    await expect(page.locator('[data-testid="generated-code-widget"]')).toBeVisible();

    await page.fill('[data-testid="chat-input"]', 'Add mobile responsive checks');
    await page.click('[data-testid="chat-submit-btn"]');

    await expect(page.locator('[data-testid="updated-code-widget"]')).toBeVisible({ timeout: 30000 });

    const originalCode = await page.locator('[data-testid="generated-code-content"]').textContent();
    const updatedCode = await page.locator('[data-testid="updated-code-content"]').textContent();

    expect(originalCode).not.toBe(updatedCode);
  });

  test('should allow access to code versions from chat history', async ({ page }) => {

    await page.fill('[data-testid="code-prompt-input"]', 'Create API testing code');
    await page.click('[data-testid="generate-code-btn"]');

    await expect(page.locator('[data-testid="generated-code-widget"]')).toBeVisible();

    await page.fill('[data-testid="chat-input"]', 'Add authentication headers');
    await page.click('[data-testid="chat-submit-btn"]');

    await expect(page.locator('[data-testid="updated-code-widget"]')).toBeVisible({ timeout: 30000 });

    await page.click('[data-testid="chat-history-btn"]');
    await expect(page.locator('[data-testid="chat-history-panel"]')).toBeVisible();

    const historyItems = page.locator('[data-testid="chat-history-item"]');
    await expect(historyItems).toHaveCount(2);

    await historyItems.first().click();
    await expect(page.locator('[data-testid="generated-code-widget"]')).toBeVisible();

    await historyItems.last().click();
    await expect(page.locator('[data-testid="updated-code-widget"]')).toBeVisible();
  });

  test('should allow updated code commit flow', async ({ page }) => {

    await page.fill('[data-testid="code-prompt-input"]', 'Create file upload test');
    await page.click('[data-testid="generate-code-btn"]');

    await expect(page.locator('[data-testid="generated-code-widget"]')).toBeVisible();

    await page.fill('[data-testid="chat-input"]', 'Add file type validation');
    await page.click('[data-testid="chat-submit-btn"]');

    await expect(page.locator('[data-testid="updated-code-widget"]')).toBeVisible({ timeout: 30000 });

    await page.click('[data-testid="commit-updated-code-btn"]');
    await expect(page.locator('[data-testid="commit-modal"]')).toBeVisible();

    await page.fill('[data-testid="commit-message-input"]', 'Add file validation');
    await page.selectOption('[data-testid="commit-branch-select"]', 'feature/updated-tests');
    await page.fill('[data-testid="commit-file-name-input"]', 'file-upload-validation.spec.ts');

    await page.click('[data-testid="commit-submit-btn"]');

    await expect(page.locator('[data-testid="commit-success-message"]'))
      .toBeVisible({ timeout: 15000 });
  });

});
