import { expect, test } from '@playwright/test'
import { majorBadge, navTo, open, selectOption, withPlan } from './fixtures'

test('switching major updates the header badge, subtitle, and BCS-only settings', async ({ page }) => {
  await open(page, '/')
  const settings = page.locator('aside')
  const major = settings.getByRole('combobox', { name: 'Major' })
  await expect(majorBadge(page)).toHaveText('BCS · 2026/27')
  await expect(settings.getByRole('group', { name: 'Specializations' })).toBeVisible()
  await expect(settings.getByRole('combobox', { name: 'Non-math elective rule' })).toBeVisible()

  await selectOption(major, 'Statistics')
  await expect(majorBadge(page)).toHaveText('Statistics · 2026/27')
  await expect(page.getByRole('main').getByText(/^Statistics \(Bachelor of Mathematics - Honours\), 2026\/27 calendar/)).toBeVisible()
  await expect(settings.getByRole('group', { name: 'Specializations' })).toBeHidden()
  await expect(settings.getByRole('combobox', { name: 'Non-math elective rule' })).toBeHidden()
})

test('sequence options follow the major', async ({ page }) => {
  await open(page, '/')
  const settings = page.locator('aside')
  const sequence = settings.getByRole('combobox', { name: 'Study / work sequence' })

  await sequence.click()
  await expect(page.getByRole('option', { name: 'Co-op Sequence 1' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Regular (non co-op)' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'SEQ 6CA (Option 1)' })).toHaveCount(0)
  await page.keyboard.press('Escape')

  await selectOption(settings.getByRole('combobox', { name: 'Major' }), 'Mathematics/CPA')
  await expect(sequence).toHaveText('SEQ 6CA (Option 1)')
  await sequence.click()
  await expect(page.getByRole('option')).toHaveText(['SEQ 6CA (Option 1)'])
})

test('toggling a specialization adds its audit card', async ({ page }) => {
  await open(page, '/')
  await page.getByRole('checkbox', { name: 'Artificial Intelligence' }).check()
  await navTo(page, 'Audit')
  await expect(page.getByRole('heading', { name: /Artificial Intelligence Specialization/ })).toBeVisible()

  await navTo(page, 'Overview')
  await page.getByRole('checkbox', { name: 'Artificial Intelligence' }).uncheck()
  await navTo(page, 'Audit')
  await expect(page.getByRole('heading', { name: 'Degree audit' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Artificial Intelligence Specialization/ })).toHaveCount(0)
})

test('"Completed through" moves courses from planned to taken', async ({ page }) => {
  await open(page, '/', withPlan({ completedThrough: -1, placements: { t0: ['CS135', 'MATH135', 'MATH137'], t1: ['CS136', 'MATH136'] } }))
  const total = page.getByRole('listitem').filter({ has: page.getByText('Total units', { exact: true }) })
  // Nothing completed: every placed unit is planned ("0.00 + 2.50 / 20.00").
  await expect(total).toContainText('+')

  await selectOption(page.getByRole('combobox', { name: 'Completed through' }), /^1B/)
  await expect(total).not.toContainText('+')

  await navTo(page, 'Planner')
  await expect(page.getByRole('region', { name: /^1A,/ }).getByText('Completed', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: /^1B,/ }).getByText('Completed', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: /^2A,/ }).getByText('Completed', { exact: true })).toHaveCount(0)
})
