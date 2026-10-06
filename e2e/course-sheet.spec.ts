import { expect, test } from '@playwright/test'
import { open } from './fixtures'

test('course sheet shows prerequisites, unlocks and offering history', async ({ page }) => {
  await open(page, '/#/?course=CS341')
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name: 'Algorithms' })).toBeVisible()
  await expect(sheet.getByText('CS 341', { exact: true })).toBeVisible()

  const prereqs = sheet.locator('section').filter({ has: page.getByRole('heading', { name: 'Prerequisites' }) })
  await expect(prereqs.getByText('All of', { exact: true }).first()).toBeVisible()
  await expect(prereqs.getByRole('button', { name: 'CS 240', exact: true })).toBeVisible()
  await expect(prereqs.getByRole('button', { name: 'MATH 239', exact: true })).toBeVisible()

  const unlocks = sheet.locator('section').filter({ has: page.getByRole('heading', { name: 'Unlocks' }) })
  await expect(unlocks.getByText(/\d+ courses? mentions? it as a requisite/)).toBeVisible()
  await expect(unlocks.getByRole('button', { name: 'CS 486', exact: true })).toBeVisible()

  const history = sheet.locator('section').filter({ has: page.getByRole('heading', { name: 'Offering history' }) })
  await expect(history.getByText(/Scheduled in \d+ of \d+ past terms/)).toBeVisible()
  await expect(history).toContainText('Historical reference')
})

test('a requisite link switches the sheet to that course', async ({ page }) => {
  await open(page, '/#/?course=CS341')
  const sheet = page.getByRole('dialog')
  await sheet.getByRole('button', { name: 'CS 486', exact: true }).click()
  await expect(page).toHaveURL(/course=CS486/)
  await expect(sheet.getByRole('heading', { name: 'Introduction to Artificial Intelligence' })).toBeVisible()
})

test('closing the sheet clears the course from the URL', async ({ page }) => {
  await open(page, '/#/audit?course=CS341')
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(page).not.toHaveURL(/course=/)
  await expect(page).toHaveURL(/#\/audit/)

  await page.getByRole('button', { name: 'Search courses' }).click()
  await page.getByPlaceholder(/Course code or title/).fill('cs 486')
  await page.keyboard.press('Enter')
  await expect(sheet).toBeVisible()
  await sheet.getByRole('button', { name: 'Close' }).click()
  await expect(sheet).toBeHidden()
  await expect(page).not.toHaveURL(/course=/)
})
