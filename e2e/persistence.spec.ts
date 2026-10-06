import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { BCS_PLAN, dismissDisclaimer, majorBadge, navTo, open, selectOption } from './fixtures'

test('a version-1 plan loads as BCS and keeps its courses', async ({ page }) => {
  const v1 = { ...BCS_PLAN, version: 1 as const }
  delete v1.major
  await open(page, '/#/planner', v1)
  await expect(majorBadge(page)).toHaveText('BCS · 2026/27')
  await expect(page.getByRole('region', { name: /^1A,/ }).getByRole('button', { name: 'CS 135', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: /^1B,/ }).getByRole('button', { name: 'CS 136', exact: true })).toBeVisible()
})

test('the plan survives a reload', async ({ page }) => {
  await open(page, '/')
  await selectOption(page.getByRole('combobox', { name: 'Major' }), 'Statistics')
  await page.reload()
  await dismissDisclaimer(page)
  await expect(majorBadge(page)).toHaveText('Statistics · 2026/27')
})

test('export downloads a version-2 plan that import restores', async ({ page }) => {
  await open(page, '/')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('uw-course-builder-plan.json')
  const file = await download.path()
  const exported = JSON.parse(await readFile(file, 'utf8'))
  expect(exported).toMatchObject({ version: 2, major: 'bcs', sequence: 'coop1', startTerm: '1259' })
  expect(exported.placements.t0).toContain('CS135')

  await page.getByRole('button', { name: 'Reset' }).click()
  await page.getByRole('dialog', { name: 'Reset the plan?' }).getByRole('button', { name: 'Reset plan' }).click()
  await selectOption(page.getByRole('combobox', { name: 'Major' }), 'Statistics')
  await expect(majorBadge(page)).toHaveText('Statistics · 2026/27')

  await page.getByLabel('Import plan JSON').setInputFiles({
    name: 'uw-course-builder-plan.json',
    mimeType: 'application/json',
    buffer: await readFile(file),
  })
  await expect(page.getByText('Imported uw-course-builder-plan.json')).toBeVisible()
  await expect(majorBadge(page)).toHaveText('BCS · 2026/27')
  await navTo(page, 'Planner')
  await expect(page.getByRole('region', { name: /^1A,/ }).getByRole('button', { name: 'CS 135', exact: true })).toBeVisible()
})

test('importing a file that is not a plan reports an error', async ({ page }) => {
  await open(page, '/')
  await page.getByLabel('Import plan JSON').setInputFiles({
    name: 'other.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello": "world"}'),
  })
  await expect(page.getByText('Could not import plan')).toBeVisible()
  await expect(majorBadge(page)).toHaveText('BCS · 2026/27')
})

test('reset clears placed courses after confirmation', async ({ page }) => {
  await open(page, '/')
  await page.getByRole('button', { name: 'Reset' }).click()
  const confirm = page.getByRole('dialog', { name: 'Reset the plan?' })
  await confirm.getByRole('button', { name: 'Cancel' }).click()
  await expect(confirm).toBeHidden()

  await page.getByRole('button', { name: 'Reset' }).click()
  await confirm.getByRole('button', { name: 'Reset plan' }).click()
  await expect(page.getByText('Plan reset')).toBeVisible()

  await navTo(page, 'Planner')
  await expect(page.getByText('Drag courses from the left, or use “Add to plan” anywhere.')).toBeVisible()
  await expect(page.getByText('0 errors')).toBeVisible()
})
