import { expect, test } from '@playwright/test'
import { open, withPlan } from './fixtures'

const BCS_NAME = 'Computer Science (Bachelor of Computer Science - Honours)'

test('audit shows core, co-op and specialization cards', async ({ page }) => {
  await open(page, '/#/audit', withPlan({ specs: ['ai'] }))
  await expect(page.getByRole('heading', { name: 'Degree audit' })).toBeVisible()
  await expect(page.getByRole('heading', { name: BCS_NAME })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Co-operative education requirements/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Artificial Intelligence Specialization/ })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Required CS courses' })).toBeVisible()
})

test('"Completed only" counts fewer courses than "With plan"', async ({ page }) => {
  await open(page, '/#/audit')
  const scope = page.getByRole('radiogroup', { name: 'Courses counted' })
  const status = page.getByText(/— counting .* \(\d+ courses\)/)
  await expect(scope.getByRole('radio', { name: 'With plan' })).toHaveAttribute('aria-checked', 'true')
  await expect(status).toContainText('completed and planned courses')
  const withPlan = Number((await status.textContent())?.match(/\((\d+) courses\)/)?.[1])

  await scope.getByRole('radio', { name: 'Completed only' }).click()
  await expect(status).toContainText('completed courses only')
  const completed = Number((await status.textContent())?.match(/\((\d+) courses\)/)?.[1])
  expect(completed).toBeGreaterThan(0)
  expect(completed).toBeLessThan(withPlan)
})

test('"Show options" lists candidate courses and filters them', async ({ page }) => {
  // Started before Fall 2026: BCS follows the Breadth & Depth rule, whose Humanities slot has many candidates.
  await open(page, '/#/audit')
  const row = page.getByRole('listitem').filter({ has: page.getByText('Humanities', { exact: true }) })
  await row.getByRole('button', { name: 'Show options' }).click()

  const popover = page.getByRole('dialog')
  await expect(popover.getByText(/\d+ available courses, most useful first/)).toBeVisible()
  const options = popover.getByRole('listitem')
  await expect(options.first()).toBeVisible()

  await popover.getByLabel('Filter options').fill('phil')
  await expect(options.first()).toContainText(/phil/i)
  // The filter matches codes and titles ("CLAS 220 Philosophy of Friendship").
  for (const text of await options.allTextContents()) expect(text).toMatch(/phil/i)

  await popover.getByLabel('Filter options').fill('zzzz no such course')
  await expect(popover.getByText('No course matches the filter.')).toBeVisible()
})

test('per-card report link pre-fills the requirement-error template', async ({ page }) => {
  await open(page, '/#/audit')
  const link = page.getByRole('link', { name: `Report a problem with ${BCS_NAME}` })
  const href = await link.getAttribute('href')
  const url = new URL(href ?? '')
  expect(url.pathname).toBe('/FYWinds/UWCourseBuilder/issues/new')
  expect(url.searchParams.get('template')).toBe('requirement-error.yml')
  expect(url.searchParams.get('program')).toBe(BCS_NAME)
  expect(href).toContain('template=requirement-error.yml')
})

test('a major with a choice renders its options', async ({ page }) => {
  await open(page, '/#/audit', withPlan({ major: 'mathfin', startTerm: '1269', completedThrough: -1, placements: {} }))
  await expect(page.getByRole('heading', { name: /^Mathematical Finance/ })).toBeVisible()
  const choice = page.locator('[data-testid^="choice-"]').filter({ hasText: 'One of 2 options' }).first()
  await expect(choice).toBeVisible()
  await expect(choice).toContainText('Counting')
  await expect(choice).toContainText('or instead:')
  await expect(choice.getByRole('button', { name: 'Show options' }).first()).toBeVisible()
})

test('a choice counts the option the plan completes', async ({ page }) => {
  await open(
    page,
    '/#/audit',
    withPlan({ major: 'mathfin', startTerm: '1269', completedThrough: -1, placements: { t0: ['MATH237', 'PMATH333'] } }),
  )
  const choice = page.getByTestId('choice-calculus-3')
  await expect(choice).toContainText('Counting MATH 237 and PMATH 333')
  await expect(choice.locator('[aria-label$=": satisfied"]').first()).toBeVisible()
  await expect(choice.getByRole('button', { name: 'Show options' })).toHaveCount(0)
})
