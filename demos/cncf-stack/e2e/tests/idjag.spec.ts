import { test, expect } from '@playwright/test';

const STEPS = ['login', 'mint', 'exchange'] as const;

test.describe('CNCF ID-JAG cross-app access demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the cross-app access UI with logical app names', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Cross-App Access');
    await expect(page.locator('h1')).toContainText('Requesting App');
    await expect(page.locator('h1')).toContainText('Receiving App');

    const config = page.locator('#config');
    await expect(config).toContainText('requesting-app');
    await expect(config).toContainText('receiving-app');
    await expect(config).toContainText('user@example.com');
  });

  test('shows a sequence diagram with three message steps', async ({ page }) => {
    await expect(page.locator('.diagram svg')).toBeVisible();
    for (const id of STEPS) {
      await expect(page.locator(`[data-step="${id}"]`)).toBeVisible();
      // Before running, each step is in the pending state.
      await expect(page.locator(`[data-step="${id}"]`)).toHaveClass(/pending/);
    }
    await expect(page.locator('.diagram')).toContainText('Mint ID-JAG');
  });

  test('runs the full ID-JAG sequence end to end', async ({ page }) => {
    await page.locator('#run').click();

    // All three step cards must reach the "ok" state.
    await expect(page.locator('.badge.ok')).toHaveCount(3, { timeout: 30_000 });

    // The sequence diagram reflects success for every hop.
    for (const id of STEPS) {
      await expect(page.locator(`[data-step="${id}"]`)).toHaveClass(/\bok\b/);
    }

    // Decoded tokens are shown, and the actor is the Requesting App.
    const steps = page.locator('#steps');
    await expect(steps.locator('pre').first()).toContainText('"sub"');
    await expect(steps).toContainText('requesting-app');
  });
});
