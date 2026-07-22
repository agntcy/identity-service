import { test, expect } from '@playwright/test';

const STEPS = ['login', 'mint', 'exchange', 'gitea-list', 'gitea-create'] as const;
const READ_WRITE = 'input[name="scope"][value="openid gitea:read gitea:write"]';

test.describe('CNCF ID-JAG cross-app access + Gitea narrow-scoping demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the cross-app access UI with logical app names', async ({ page }) => {
    await expect(page.locator('header')).toContainText('Cross-App Access');
    await expect(page.locator('header')).toContainText('Requesting App');
    await expect(page.locator('header')).toContainText('Gitea');

    const config = page.locator('#config');
    await expect(config).toContainText('requesting-app');
    await expect(config).toContainText('receiving-app');
    await expect(config).toContainText('user@example.com');
    await expect(config).toContainText('gitea-gateway');

    // The scope selector defaults to read-only.
    await expect(page.locator('input[name="scope"]:checked')).toHaveValue('openid gitea:read');
  });

  test('shows a sequence diagram with five message steps and Gitea', async ({ page }) => {
    await expect(page.locator('#tab-demo .diagram svg')).toBeVisible();
    for (const id of STEPS) {
      await expect(page.locator(`[data-step="${id}"]`)).toBeVisible();
      await expect(page.locator(`[data-step="${id}"]`)).toHaveClass(/pending/);
    }
    await expect(page.locator('#tab-demo .diagram')).toContainText('Mint ID-JAG');
    await expect(page.locator('#tab-demo .diagram')).toContainText('gitea:write');
  });

  test('has a How it works tab explaining Keycloak config and VCs', async ({ page }) => {
    // Demo tab is active by default; the how tab is hidden.
    await expect(page.locator('#tab-how')).toBeHidden();

    await page.getByRole('button', { name: 'How it works' }).click();

    await expect(page.locator('#tab-how')).toBeVisible();
    await expect(page.locator('#tab-demo')).toBeHidden();

    const how = page.locator('#tab-how');
    await expect(how).toContainText('identity-assertion-jwt');
    await expect(how).toContainText('oauth2.jwt.authorization.grant.enabled');
    await expect(how).toContainText('Verifiable Credentials');
    await expect(how).toContainText('/vc/publish');
    await expect(how).toContainText('VC-backed ID-JAG');
    // Extra explainer sequence diagrams are present.
    await expect(how.locator('.diagram.doc svg').first()).toBeVisible();

    // Switching back restores the live demo.
    await page.getByRole('button', { name: 'Live demo' }).click();
    await expect(page.locator('#tab-demo')).toBeVisible();
    await expect(page.locator('#tab-how')).toBeHidden();
  });

  test('read-only run: lists repos but is denied the write (narrow scoping)', async ({ page }) => {
    await page.locator('#run').click();

    // login + mint + exchange + gitea-list succeed; gitea-create is denied.
    await expect(page.locator('.badge.ok')).toHaveCount(4, { timeout: 45_000 });
    await expect(page.locator('.badge.denied')).toHaveCount(1, { timeout: 45_000 });

    await expect(page.locator('[data-step="gitea-list"]')).toHaveClass(/\bok\b/);
    await expect(page.locator('[data-step="gitea-create"]')).toHaveClass(/\bdenied\b/);

    const steps = page.locator('#steps');
    await expect(steps).toContainText('gitea:write');
  });

  test('read+write run: creates the repo', async ({ page }) => {
    await page.locator(READ_WRITE).check();
    await page.locator('#run').click();

    await expect(page.locator('.badge.ok')).toHaveCount(5, { timeout: 45_000 });
    for (const id of STEPS) {
      await expect(page.locator(`[data-step="${id}"]`)).toHaveClass(/\bok\b/);
    }
    const steps = page.locator('#steps');
    await expect(steps).toContainText('created');
  });

  test('steps through all five hops one at a time', async ({ page }) => {
    const step = page.locator('#step');

    await step.click(); // login
    await expect(page.locator('.badge.ok')).toHaveCount(1, { timeout: 20_000 });
    await expect(page.locator('[data-step="login"]')).toHaveClass(/\bok\b/);

    await step.click(); // mint
    await expect(page.locator('.badge.ok')).toHaveCount(2, { timeout: 20_000 });

    await step.click(); // exchange
    await expect(page.locator('.badge.ok')).toHaveCount(3, { timeout: 20_000 });

    await step.click(); // gitea-list (read)
    await expect(page.locator('[data-step="gitea-list"]')).toHaveClass(/\bok\b/, { timeout: 20_000 });

    await step.click(); // gitea-create -> denied under read-only
    await expect(page.locator('[data-step="gitea-create"]')).toHaveClass(/\bdenied\b/, { timeout: 20_000 });
    await expect(step).toBeDisabled();
    await expect(step).toHaveText(/Done/);
  });
});
