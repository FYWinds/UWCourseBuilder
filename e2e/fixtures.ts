import { type Locator, type Page, expect } from '@playwright/test'

/** Stored plan shape (zustand persist payload `state.plan`); version 1 plans have no `major`. */
export interface SeedPlan {
  version: 1 | 2
  major?: string
  sequence: string
  startTerm: string
  specs: string[]
  wtLimit: 1 | 2
  completedThrough: number
  placements: Record<string, string[]>
  breadthRule?: string
}

/** BCS student who started Fall 2025: 1A and 1B completed, CS 341 placed too early (first work term). */
export const BCS_PLAN: SeedPlan = {
  version: 2,
  major: 'bcs',
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
}

export const withPlan = (patch: Partial<SeedPlan>): SeedPlan => ({ ...BCS_PLAN, ...patch })

/**
 * Seeds `uwcb-plan` before the app boots. The sessionStorage guard seeds only the first
 * load of the tab, so reloads observe what the app itself persisted.
 */
export async function seedPlan(page: Page, plan: SeedPlan) {
  await page.addInitScript((stored) => {
    if (!sessionStorage.getItem('uwcb-seeded')) {
      localStorage.setItem('uwcb-plan', JSON.stringify(stored))
      sessionStorage.setItem('uwcb-seeded', '1')
    }
  }, { state: { plan }, version: plan.version })
}

/**
 * The disclaimer opens on every page load; acknowledge it and wait for it to close.
 * CSS lookup: a deep-linked course sheet opens as a second modal and hides the disclaimer from the a11y tree.
 */
export async function dismissDisclaimer(page: Page) {
  const dialog = page.locator('[role="dialog"]', { hasText: 'Before you start' })
  await dialog.locator('button', { hasText: 'I understand' }).click()
  await expect(dialog).toBeHidden()
}

/** Seed a plan, open a hash route (e.g. `/#/audit`), and dismiss the disclaimer. */
export async function open(page: Page, path: string, plan: SeedPlan = BCS_PLAN) {
  await seedPlan(page, plan)
  await page.goto(path)
  await dismissDisclaimer(page)
}

/** Navigate with the header nav (keeps in-memory state, unlike `goto`). */
export async function navTo(page: Page, label: 'Overview' | 'Audit' | 'Explore' | 'Planner' | 'Prereq graph') {
  await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click()
}

/** Choose an option in a shadcn/radix Select identified by its combobox. */
export async function selectOption(combobox: Locator, option: string | RegExp) {
  await combobox.click()
  await combobox.page().getByRole('option', { name: option, exact: true }).click()
  await expect(combobox.page().getByRole('listbox')).toBeHidden()
}

/** Header badge "<short name> · 2026/27". */
export const majorBadge = (page: Page) => page.getByRole('banner').getByText(/· 2026\/27$/)

/** Synthetic Quest transcript (two-space column joins, as pdf.js produces). */
export const TRANSCRIPT = `University of Waterloo  Page 1 of 2
Undergraduate Unofficial Transcript
Name:  Doe, Jane
Student ID:  20000000
Beginning of Undergraduate Record
Fall 2025
Program:  Computer Science, Honours, Co-operative Program
Level:  1A  Load: Full-Time  Form Of Study: Enrolment
Course  Description  Attempted  Earned  Grade
CS  135  Designing Functional Programs  0.50  0.50  88
MATH  135  Algebra for Honours Mathematics  0.50  0.50  71
MATH  137  Calculus 1 for Honours Mathematics  0.50  0.50  45
SPCOM  223  Public Speaking  0.50  0.50  80
ECON  101  Introduction to Microeconomics  0.50  0.00  WD
In GPA  Earned
Term GPA  70.00  Term Totals  2.50  2.00
Winter 2026
Program:  Computer Science/Artificial Intelligence Specialization, Honours, Co-operative Program
Level:  1B  Load: Full-Time  Form Of Study: Enrolment
Course  Description  Attempted  Earned  Grade
CS  136  Elementary Algorithm Design and Data Abstraction  0.50  0.50  90
MATH  137  Calculus 1 for Honours Mathematics  0.50  0.50  65
PD  1  Career Fundamentals  0.50  0.00  CR
Spring 2026
Level:  1B  Load: Part-Time  Form Of Study: Co-op Work Term
Course  Description  Attempted  Earned  Grade
COOP  1  Co-operative Work Term  0.50  0.00  CR
PD  11  Processes for Technical Report Writing  0.50  0.00  CR
Fall 2026
Level:  2A  Load: Full-Time  Form Of Study: Enrolment
Course  Description  Attempted  Earned  Grade
CS  245  Logic and Computation
MATH  239  Introduction to Combinatorics
STAT  230  Probability
Milestones
Date Completed  Description  Status
End of Undergraduate Unofficial Transcript`
