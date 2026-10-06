import { expect, test } from '@playwright/test'
import { open } from './fixtures'

const REPO = 'https://github.com/FYWinds/UWCourseBuilder'

test('header links point to the GitHub repository and issue chooser', async ({ page }) => {
  await open(page, '/')
  const header = page.getByRole('banner')
  await expect(header.getByRole('link', { name: 'Report a problem', exact: true })).toHaveAttribute(
    'href',
    `${REPO}/issues/new/choose`,
  )
  await expect(header.getByRole('link', { name: 'GitHub repository' })).toHaveAttribute('href', REPO)
})

test('theme menu toggles dark mode on the document', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await open(page, '/')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/\bdark\b/)

  await page.getByRole('button', { name: 'Theme' }).click()
  await page.getByRole('menuitemradio', { name: 'Dark' }).click()
  await expect(html).toHaveClass(/\bdark\b/)

  await page.getByRole('button', { name: 'Theme' }).click()
  await page.getByRole('menuitemradio', { name: 'Light' }).click()
  await expect(html).not.toHaveClass(/\bdark\b/)
})

test('Ctrl+K opens course search and Enter opens the course sheet', async ({ page }) => {
  await open(page, '/')
  await page.keyboard.press('Control+k')
  const search = page.getByPlaceholder(/Course code or title/)
  await expect(search).toBeVisible()
  await search.fill('cs 341')
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/course=CS341/)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Algorithms' })).toBeVisible()
})

test('search button opens course search and a result opens the course sheet', async ({ page }) => {
  await open(page, '/')
  await page.getByRole('button', { name: 'Search courses' }).click()
  await page.getByPlaceholder(/Course code or title/).fill('cs 486')
  await page.getByRole('option', { name: /CS 486/ }).first().click()

  await expect(page).toHaveURL(/course=CS486/)
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Introduction to Artificial Intelligence' })).toBeVisible()
})
