import { expect, test } from '@playwright/test'
import { open } from './fixtures'

test('planner summarizes units, terms and issues', async ({ page }) => {
  await open(page, '/#/planner')
  await expect(page.getByRole('heading', { name: 'Term planner' })).toBeVisible()
  await expect(page.getByText('Co-op Sequence 1 · 1A in Fall 2025')).toBeVisible()
  // Ten 0.50-unit courses plus CS 136L (0.25); eight full-time terms are needed on co-op.
  const summary = page.locator('dl')
  await expect(summary).toContainText(/Planned\s*5\.25 \/ 20 units/)
  await expect(summary).toContainText(/Full-time terms\s*\d+ \/ 8/)

  const term1A = page.getByRole('region', { name: /^1A,/ })
  await expect(term1A.getByText('5 courses')).toBeVisible()
  await expect(term1A.getByText('Completed', { exact: true })).toBeVisible()
})

test('a course placed before its prerequisites shows an error', async ({ page }) => {
  await open(page, '/#/planner')
  await expect(page.getByText(/^[1-9]\d* errors?$/)).toBeVisible()

  const card = page.getByRole('region', { name: 'Terms' }).getByRole('button', { name: /^CS 341 Algorithms/ })
  const indicator = card.getByRole('button', { name: /^\d+ issues?:/ })
  await expect(indicator).toBeVisible()
  await expect(indicator).toHaveAttribute('aria-label', /Prerequisite/i)
  await indicator.hover()
  await expect(page.getByRole('tooltip').getByLabel('Error').first()).toBeVisible()
})

test('removing a course clears it from the term and its error', async ({ page }) => {
  await open(page, '/#/planner')
  const errors = page.getByText(/^\d+ errors?$/)
  const before = Number((await errors.textContent())?.split(' ')[0])
  expect(before).toBeGreaterThan(0)

  await page.getByRole('button', { name: 'Remove CS 341 from plan' }).click()
  await expect(page.getByRole('region', { name: 'Terms' }).getByRole('button', { name: /^CS 341 Algorithms/ })).toHaveCount(0)
  await expect.poll(async () => Number((await errors.textContent())?.split(' ')[0])).toBeLessThan(before)
})
