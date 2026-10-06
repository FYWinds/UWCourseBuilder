import { type Page, expect, test } from '@playwright/test'
import { open, withPlan } from './fixtures'

const courseRow = (page: Page, code: string) =>
  page.getByRole('row').filter({ has: page.getByRole('button', { name: code, exact: true }) })

/** "N of M courses" counter above the table. */
async function shownCount(page: Page) {
  const text = await page.getByText(/^[\d,]+ of [\d,]+ courses$/).textContent()
  return Number(text?.split(' of ')[0].replace(/,/g, ''))
}

test('text search narrows the table', async ({ page }) => {
  await open(page, '/#/explore')
  await expect(page.getByRole('heading', { name: 'Explore courses' })).toBeVisible()
  const total = await shownCount(page)

  await page.getByLabel('Search by code or title').fill('cs 486')
  await expect(page).toHaveURL(/q=cs/)
  await expect(courseRow(page, 'CS 486')).toBeVisible()
  await expect.poll(() => shownCount(page)).toBeLessThan(total)
  await expect(courseRow(page, 'CS 135')).toHaveCount(0)
})

test('quick filters include breadth presets for BCS only', async ({ page }) => {
  await open(page, '/#/explore')
  const presets = page.getByRole('group', { name: 'Quick filters' })
  await expect(presets.getByRole('button', { name: /^Breadth:/ }).first()).toBeVisible()

  const must = presets.getByRole('button', { name: 'Must & required' })
  await must.click()
  await expect(must).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '2 statuses' })).toBeVisible()
  await must.click()
  await expect(must).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: 'All statuses' })).toBeVisible()
})

test('quick filters omit breadth presets for Statistics', async ({ page }) => {
  await open(page, '/#/explore', withPlan({ major: 'stat', startTerm: '1269' }))
  const presets = page.getByRole('group', { name: 'Quick filters' })
  await expect(presets.getByRole('button', { name: 'Must & required' })).toBeVisible()
  await expect(presets.getByRole('button', { name: /^Breadth:/ })).toHaveCount(0)
})

test('status filter shows only matching courses', async ({ page }) => {
  await open(page, '/#/explore')
  await page.getByRole('button', { name: 'All statuses' }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Taken' }).click()
  await page.keyboard.press('Escape')

  await expect(page.getByRole('button', { name: 'Taken', exact: true })).toBeVisible()
  // BCS_PLAN completes ten courses in 1A and 1B.
  await expect(page.getByText(/^10 of [\d,]+ courses$/)).toBeVisible()
  await expect(courseRow(page, 'CS 135')).toBeVisible()
  await expect(courseRow(page, 'CS 341')).toHaveCount(0)

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('button', { name: 'All statuses' })).toBeVisible()
})

test('clicking a row opens the course sheet', async ({ page }) => {
  await open(page, '/#/explore?q=CS486')
  const row = courseRow(page, 'CS 486')
  await row.getByText('Introduction to Artificial Intelligence').click()
  await expect(page).toHaveURL(/course=CS486/)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Introduction to Artificial Intelligence' })).toBeVisible()
})

test('the row action adds a course to a term', async ({ page }) => {
  await open(page, '/#/explore?q=CS486')
  const row = courseRow(page, 'CS 486')
  await expect(row).not.toContainText('Planned')

  await row.getByRole('button', { name: 'Add CS 486 in plan' }).click()
  await page.getByRole('menuitem', { name: /^4A/ }).click()
  await expect(page.getByText(/CS 486 → 4A/)).toBeVisible()
  await expect(page).not.toHaveURL(/course=/)
  await expect(row.getByRole('button', { name: 'Move CS 486 in plan' })).toBeVisible()
  await expect(row).toContainText('Planned')
})
