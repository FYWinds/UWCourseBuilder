import { expect, test } from '@playwright/test'
import { open } from './fixtures'

test('graph renders the default focus and changes focus via the picker', async ({ page }) => {
  await open(page, '/#/graph')
  await expect(page.getByRole('heading', { name: 'Prerequisite graph' })).toBeVisible()
  const picker = page.getByRole('combobox', { name: 'Focus course: CS 486' })
  await expect(picker).toBeVisible()

  const nodes = page.locator('.react-flow__node')
  await expect(nodes.filter({ hasText: 'CS 486' })).toBeVisible()
  await expect(nodes.filter({ hasText: 'CS 341' })).toBeVisible()
  await expect(page.getByText(/· Introduction to Artificial Intelligence · \d+ courses/)).toBeVisible()

  await picker.click()
  await page.getByPlaceholder('Course code, e.g. CS 341').fill('math 247')
  await page.getByRole('option', { name: /MATH 247/ }).click()

  await expect(page).toHaveURL(/focus=MATH247/)
  await expect(page.getByRole('combobox', { name: 'Focus course: MATH 247' })).toBeVisible()
  await expect(nodes.filter({ hasText: 'MATH 247' })).toBeVisible()
  await expect(nodes.filter({ hasText: 'MATH 148' })).toBeVisible()
  await expect(nodes.filter({ hasText: 'CS 486' })).toHaveCount(0)
})

test('clicking a graph node opens its course sheet', async ({ page }) => {
  await open(page, '/#/graph')
  await page.locator('.react-flow__node').filter({ hasText: 'CS 341' }).click()
  await expect(page).toHaveURL(/course=CS341/)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Algorithms' })).toBeVisible()
})
