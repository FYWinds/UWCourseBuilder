export { type Allocation, type DepthResult, type SlotAllocation, allocate, effectiveSlots } from './allocate'
export { type AuditResult, type ProgramAudit, type TotalResult, activePrograms, auditPlan } from './audit'
export {
  type CatalogIndex,
  buildIndex,
  collectCourses,
  countsTowardDegree,
  expandSet,
  formatCode,
  numericPart,
} from './catalog'
export {
  type Classification,
  type ClassifyResult,
  type CourseStatus,
  type SlotRef,
  STATUS_ORDER,
  classify,
  enrolmentTokens,
  slotCandidates,
} from './classify'
export { type Issue, type PlanValidation, type Severity, placementKey, validatePlan } from './planner'
export { type Verdict, evaluate, manualChecks, programAllows } from './requisites'
export { type PlacedCourse, buildTerms, nextTermCode, parseTermCode, placedCourses, termName } from './terms'
export {
  type TranscriptImportResult,
  type TranscriptSummary,
  defaultEquivalences,
  detectSpecs,
  inferSequence,
  parseTranscript,
  planFromTranscript,
} from './transcript'
