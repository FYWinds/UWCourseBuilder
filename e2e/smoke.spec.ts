import { expect, test } from '@playwright/test'

const PLAN = {
  state: {
    plan: {
      version: 1,
      sequence: 'coop1',
      startTerm: '1259',
      specs: [],
      wtLimit: 1,
      completedThrough: 1,
      placements: {
        t0: ['CS135', 'MATH135', 'MATH137', 'ENGL109', 'PSYCH101'],
        t1: ['CS136', 'CS136L', 'MATH136', 'MATH138', 'ECON101'],
        t2: ['CS341'],
      },
    },
  },
  version: 1,
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((plan) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('uwcb-plan', JSON.stringify(plan))
      sessionStorage.setItem('seeded', '1')
    }
  }, PLAN)
})

test('overview lists must-take courses and specializations update the audit', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'What you still must take' })).toBeVisible()
  await expect(page.getByText('CS 350').first()).toBeVisible()

  await page.getByRole('checkbox', { name: 'Artificial Intelligence' }).check()
  await page.getByRole('link', { name: 'Audit', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Artificial Intelligence Specialization/ })).toBeVisible()
})

test('course search opens the detail sheet with prerequisites', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Search courses' }).click()
  await page.getByPlaceholder(/Course code or title/).fill('cs 341')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/course=CS341/)
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText('Algorithms').first()).toBeVisible()
  await expect(sheet.getByText(/Prerequisite/i).first()).toBeVisible()
})

test('planner flags a course placed before its prerequisites', async ({ page }) => {
  await page.goto('/#/planner')
  await expect(page.getByRole('heading', { name: 'Term planner' })).toBeVisible()
  // CS 341 sits in the first work term without CS 240/245/MATH 239/STAT 230.
  await expect(page.getByText(/[1-9]\d* errors?/).first()).toBeVisible()
})
