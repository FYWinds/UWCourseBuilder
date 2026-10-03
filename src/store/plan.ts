import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BreadthRule, Plan, SequenceId } from '@/domain/plan'
import type { SpecId } from '@/domain/requirements'
import type { CourseCode } from '@/domain/types'

/** Fall term that is 1A for a student starting this academic year (2026/27 calendar). */
export const DEFAULT_START_TERM = '1269'

export function emptyPlan(): Plan {
  return {
    version: 1,
    sequence: 'coop1',
    startTerm: DEFAULT_START_TERM,
    specs: [],
    wtLimit: 1,
    placements: {},
    completedThrough: -1,
  }
}

interface PlanStore {
  plan: Plan
  setSequence: (sequence: SequenceId) => void
  setStartTerm: (term: string) => void
  toggleSpec: (spec: SpecId) => void
  setWtLimit: (limit: 1 | 2) => void
  setCompletedThrough: (index: number) => void
  /** `undefined` = follow the 1A term. */
  setBreadthRule: (rule: BreadthRule | undefined) => void
  /** Adds a course to a term; a course lives in at most one term, so it moves if present. */
  placeCourse: (termId: string, code: CourseCode) => void
  removeCourse: (code: CourseCode) => void
  replacePlan: (plan: Plan) => void
  reset: () => void
}

function withoutCourse(placements: Plan['placements'], code: CourseCode): Plan['placements'] {
  return Object.fromEntries(
    Object.entries(placements)
      .map(([termId, codes]) => [termId, codes.filter((c) => c !== code)] as const)
      .filter(([, codes]) => codes.length > 0),
  )
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      plan: emptyPlan(),
      setSequence: (sequence) => set((s) => ({ plan: { ...s.plan, sequence } })),
      setStartTerm: (startTerm) => set((s) => ({ plan: { ...s.plan, startTerm } })),
      toggleSpec: (spec) =>
        set((s) => ({
          plan: {
            ...s.plan,
            specs: s.plan.specs.includes(spec) ? s.plan.specs.filter((x) => x !== spec) : [...s.plan.specs, spec],
          },
        })),
      setWtLimit: (wtLimit) => set((s) => ({ plan: { ...s.plan, wtLimit } })),
      setCompletedThrough: (completedThrough) => set((s) => ({ plan: { ...s.plan, completedThrough } })),
      setBreadthRule: (breadthRule) =>
        set((s) => {
          const { breadthRule: _previous, ...rest } = s.plan
          return { plan: breadthRule ? { ...rest, breadthRule } : rest }
        }),
      placeCourse: (termId, code) =>
        set((s) => {
          const placements = withoutCourse(s.plan.placements, code)
          placements[termId] = [...(placements[termId] ?? []), code]
          return { plan: { ...s.plan, placements } }
        }),
      removeCourse: (code) => set((s) => ({ plan: { ...s.plan, placements: withoutCourse(s.plan.placements, code) } })),
      replacePlan: (plan) => set({ plan }),
      reset: () => set({ plan: emptyPlan() }),
    }),
    { name: 'uwcb-plan', version: 1 },
  ),
)

/** Validate an imported JSON document; throws with a readable message. */
export function parsePlanJson(text: string): Plan {
  const data = JSON.parse(text) as Partial<Plan>
  if (data.version !== 1 || typeof data.placements !== 'object' || !data.sequence || !data.startTerm) {
    throw new Error('Not a UW Course Builder plan (version 1)')
  }
  return { ...emptyPlan(), ...data } as Plan
}
