import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Real automated accessibility audit using axe-core (the same engine
// behind Chrome DevTools' Lighthouse a11y checks and most commercial
// a11y scanners). This catches things a manual pass can miss —
// missing form labels, invalid ARIA usage, heading order, etc. It
// does NOT replace a screen-reader walkthrough by an actual person,
// which catches usability issues axe can't detect (e.g. confusing
// reading order that's technically valid HTML).

test('home page has no critical or serious axe violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const critical = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  if (critical.length > 0) {
    console.log(JSON.stringify(critical, null, 2));
  }
  expect(critical).toEqual([]);
});

test('auth modal has no critical or serious axe violations', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sign in to sync').click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  const critical = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  if (critical.length > 0) {
    console.log(JSON.stringify(critical, null, 2));
  }
  expect(critical).toEqual([]);
});

test('light theme has no critical or serious axe violations', async ({ page }) => {
  await page.goto('/');
  await page.getByTitle('Toggle theme (D)').click();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

  const critical = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  if (critical.length > 0) {
    console.log(JSON.stringify(critical, null, 2));
  }
  expect(critical).toEqual([]);
});
