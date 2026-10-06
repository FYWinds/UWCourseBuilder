import { type Page, expect, test } from '@playwright/test'
import { TRANSCRIPT, navTo, open, withPlan } from './fixtures'

async function readPasted(page: Page, text: string) {
  await page.getByRole('button', { name: 'Import transcript' }).click()
  const dialog = page.getByRole('dialog', { name: 'Import Quest transcript' })
  await dialog.getByRole('tab', { name: 'Paste text' }).click()
  await dialog.getByLabel('Transcript text').fill(text)
  await dialog.getByRole('button', { name: 'Read transcript' }).click()
  return dialog
}

test('pasted transcript previews detected terms and places courses', async ({ page }) => {
  await open(page, '/', withPlan({ startTerm: '1269', completedThrough: -1, placements: {} }))
  const dialog = await readPasted(page, TRANSCRIPT)

  await expect(dialog.getByText('1A: Fall 2025')).toBeVisible()
  await expect(dialog.getByRole('combobox').first()).toHaveText('BCS')
  await expect(dialog.getByRole('checkbox', { name: 'Artificial Intelligence' })).toBeChecked()
  // PD 11 in the Spring 2026 work term makes WT 1 the last completed term.
  await expect(dialog.getByText(/\d+ courses · completed through WT 1/)).toBeVisible()
  await expect(dialog.getByText('CS 135', { exact: true })).toBeVisible()
  await expect(dialog.getByText('MATH 239', { exact: true })).toBeVisible()

  await dialog.getByRole('button', { name: 'Replace completed terms with transcript' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText(/Imported \d+ courses from your transcript/)).toBeVisible()

  await navTo(page, 'Planner')
  await expect(page.getByText('1A in Fall 2025')).toBeVisible()
  const term1A = page.getByRole('region', { name: /^1A,/ })
  await expect(term1A.getByRole('button', { name: 'CS 135', exact: true })).toBeVisible()
  await expect(term1A.getByText('Completed', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: /^2A,/ }).getByRole('button', { name: 'MATH 239', exact: true })).toBeVisible()

  await navTo(page, 'Audit')
  await expect(page.getByRole('heading', { name: /Artificial Intelligence Specialization/ })).toBeVisible()
})

test('transcript program line selects the matching major', async ({ page }) => {
  await open(page, '/', withPlan({ placements: {}, completedThrough: -1 }))
  const statistics = TRANSCRIPT.replace(/^Program: .*$/gm, 'Program:  Statistics, Honours, Co-operative Program')
  const dialog = await readPasted(page, statistics)
  await expect(dialog.getByRole('combobox').first()).toHaveText('Statistics')
  await expect(dialog.getByRole('group', { name: 'Specializations' })).toHaveCount(0)
})

test('text without terms shows an error', async ({ page }) => {
  await open(page, '/')
  const dialog = await readPasted(page, 'not a transcript')
  await expect(dialog.getByText(/No terms found/)).toBeVisible()
})
