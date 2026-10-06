import { expect, test } from '@playwright/test'
import { BCS_PLAN, dismissDisclaimer, seedPlan } from './fixtures'

test('disclaimer shows on every load until acknowledged', async ({ page }) => {
  await seedPlan(page, BCS_PLAN)
  await page.goto('/')
  const dialog = page.getByRole('dialog', { name: 'Before you start' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('unofficial planning aid')

  await dismissDisclaimer(page)
  await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()

  await page.reload()
  await expect(dialog).toBeVisible()
})
