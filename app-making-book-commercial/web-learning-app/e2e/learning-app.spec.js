import { test, expect } from '@playwright/test';

// These exercise the app in guest mode (no backend required) — the
// core learning-app experience must work with zero network calls,
// since that's the actual default for anyone who hasn't signed in.

test('loads and shows the first lesson', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('How the whole app fits together')).toBeVisible();
});

test('search filters the lesson list', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Search (press / )').fill('bcrypt');
  await expect(page.getByText('Authentication: passwords and JWTs')).toBeVisible();
  await expect(page.getByText('Room: the local database')).not.toBeVisible();
});

test('marking a lesson complete updates the progress bar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('0%')).toBeVisible();
  await page.getByRole('button', { name: 'Mark lesson complete' }).click();
  await expect(page.getByText('Marked complete')).toBeVisible();
  await expect(page.getByText('13%')).toBeVisible(); // 1 of 8 lessons
});

test('keyboard shortcut "/" focuses the search box', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('/');
  await expect(page.getByPlaceholder('Search (press / )')).toBeFocused();
});

test('track filter chips narrow the lesson list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'backend', exact: true }).click();
  await expect(page.getByText('MVVM + Hilt: who owns what')).not.toBeVisible();
});
