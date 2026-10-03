import { use, useDeferredValue, useMemo } from 'react'
import type { Plan } from '@/domain/plan'
import type { Catalog } from '@/domain/types'
import {
  type AuditResult,
  type CatalogIndex,
  type ClassifyResult,
  type PlanValidation,
  auditPlan,
  buildIndex,
  classify,
  validatePlan,
} from '@/engine'
import { usePlanStore } from '@/store/plan'

let catalogPromise: Promise<CatalogIndex> | null = null

export function loadCatalog(): Promise<CatalogIndex> {
  catalogPromise ??= fetch(`${import.meta.env.BASE_URL}data/catalog.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load course data (${res.status})`)
      return res.json() as Promise<Catalog>
    })
    .then(buildIndex)
  return catalogPromise
}

/** Suspends until the catalog is loaded. */
export function useCatalog(): CatalogIndex {
  return use(loadCatalog())
}

export interface Analysis {
  idx: CatalogIndex
  plan: Plan
  /** Audit of taken + planned courses (projected graduation check). */
  audit: AuditResult
  /** Audit of completed courses only. */
  takenAudit: AuditResult
  classification: ClassifyResult
  validation: PlanValidation
}

/**
 * Everything derived from the plan. Recomputed on a deferred copy of the plan so
 * drag-and-drop stays responsive while classification (~60 ms) runs.
 */
export function useAnalysis(): Analysis {
  const idx = useCatalog()
  const plan = useDeferredValue(usePlanStore((s) => s.plan))
  return useMemo(() => {
    const audit = auditPlan(plan, idx)
    return {
      idx,
      plan,
      audit,
      takenAudit: auditPlan(plan, idx, 'taken'),
      classification: classify(plan, audit, idx),
      validation: validatePlan(plan, idx),
    }
  }, [idx, plan])
}
