/**
 * Quest "Undergraduate Unofficial Transcript" import.
 *
 * Input is the transcript as text lines — either reconstructed from the PDF
 * (columns joined by spaces) or pasted from a PDF viewer. Only courses, terms,
 * levels, the program name and course-equivalence notes are read; names and
 * student numbers are never extracted.
 *
 * Layout (per term):
 *   Fall 2018
 *   Program: Computer Science/Digital Hardware Option, Honours, Co-operative Program
 *   Level: 2A  Load: Full-Time  Form Of Study: Enrolment
 *   Course  Description  Attempted  Earned  Grade
 *   CS  241E  Foundations of Sequential Programs (Enriched)  0.50  0.50  100
 *   CS  240E  Data Structures …                      ← current term: no grade yet
 *   ECE 222=CS 251.                                    ← equivalence note
 * and at the end a "Transfer Credits" table: SUBJ NBR Description Earned.
 */
import type { Plan, SequenceId } from '@/domain/plan'
import { SEQUENCES, TRANSFER_TERM_ID } from '@/domain/plan'
import type { Program, SpecId } from '@/domain/requirements'
import type { CourseCode } from '@/domain/types'
import { MAJORS } from '@/requirements/majors'
import { SPECS } from '@/requirements/specs'
import { programVariants } from './allocate'
import { type CatalogIndex, expandSet } from './catalog'
import { nextTermCode } from './terms'

export type TranscriptCourseStatus = 'passed' | 'in-progress' | 'failed' | 'transfer'

export interface TranscriptCourse {
  code: CourseCode
  title: string
  grade?: string
  status: TranscriptCourseStatus
}

export interface TranscriptTerm {
  termCode: string
  level?: string
  workTerm: boolean
  courses: TranscriptCourse[]
}

export interface TranscriptSummary {
  program?: string
  terms: TranscriptTerm[]
  transfer: TranscriptCourse[]
  /** "ECE 222=CS 251" style notes: `from` counts as `to`. */
  equivalences: { from: CourseCode; to: CourseCode }[]
  /** Co-op sequence stated on the grade report ("SEQ 4"). */
  sequenceHint?: SequenceId
}

const SEASON_DIGIT: Record<string, string> = { Winter: '1', Spring: '5', Fall: '9' }
const TERM_HEADING = /^(Fall|Winter|Spring)\s+(\d{4})$/
const SUBJECT = /^[A-Z]{2,}$/
const NUMBER = /^(\d{1,3}[A-Z]{0,2}|\dXX)$/
const CREDIT = /^\d+\.\d{2}$/
/**
 * Single-spaced fallback for pasted text: SUBJ NBR Description, then
 * "Attempted Earned Grade", a lone credit (transfer), a bare grade, or nothing.
 */
const COURSE_ROW =
  /^([A-Z]{2,}) (\d{1,3}[A-Z]{0,2}|\dXX) (.+?)(?: (\d+\.\d{2}) (\d+\.\d{2}) ([A-Z]{1,4}|\d{1,3})| (\d+\.\d{2})| (\d{2,3}|CR|NCR|WD|WF|DNW|INC|AUD|NG|FTC|IP|MM))?$/
const PASSING_LETTER_GRADES = new Set(['CR', 'AUD', 'NG'])
/** One "A NNN = B NNN" clause of a comma-separated equivalence note. */
const EQUIVALENCE = /^([A-Z]{2,})\s*(\d{1,3}[A-Z]{0,2})\s*=\s*([A-Z]{2,})\s*(\d{1,3}[A-Z]{0,2})\.?$/

interface CourseRow {
  subject: string
  number: string
  title: string
  earned?: string
  grade?: string
  /** Lone credit value: a transfer-credit row. */
  transferCredit: boolean
}

/**
 * PDF lines keep column gaps (2+ spaces), which separates titles ending in a
 * number ("Physics 2") from a grade column; pasted text falls back to a regex.
 */
function parseCourseRow(cells: string[], line: string): CourseRow | null {
  if (cells.length >= 3 && SUBJECT.test(cells[0]) && NUMBER.test(cells[1])) {
    const tail = cells.slice(3)
    const credits = tail.filter((c) => CREDIT.test(c))
    const grade = tail.find((c) => !CREDIT.test(c))
    return {
      subject: cells[0],
      number: cells[1],
      title: cells[2],
      ...(credits[1] && { earned: credits[1] }),
      ...(grade && { grade }),
      transferCredit: credits.length === 1 && grade === undefined,
    }
  }
  const m = line.match(COURSE_ROW)
  if (!m) return null
  const [, subject, number, title, , earned, grade, credit, bareGrade] = m
  return {
    subject,
    number,
    title,
    ...(earned && { earned }),
    ...((grade ?? bareGrade) && { grade: grade ?? bareGrade }),
    transferCredit: credit !== undefined,
  }
}

function courseStatus(earned: string | undefined, grade: string | undefined): TranscriptCourseStatus {
  if (grade === undefined) return 'in-progress'
  if (/^\d+$/.test(grade)) return Number(grade) >= 50 ? 'passed' : 'failed'
  if (PASSING_LETTER_GRADES.has(grade)) return 'passed'
  // WD, WF, NCR, DNW, FTC, INC, …: credit only if some was earned.
  return earned !== undefined && Number(earned) > 0 ? 'passed' : 'failed'
}

/**
 * Accepts both Quest documents: the "Undergraduate Unofficial Transcript"
 * (oldest term first, credit columns, per-term Program/Level lines) and the
 * "Unofficial Grade Report" (newest term first, grade only, a "3A Computer
 * Science, Honours, …" header and a "SEQ 4" co-op sequence row).
 */
export function parseTranscript(text: string): TranscriptSummary {
  const summary: TranscriptSummary = { terms: [], transfer: [], equivalences: [] }
  let current: TranscriptTerm | null = null
  let inTransfer = false

  for (const raw of text.split(/\r?\n/)) {
    const cells = raw.trim().split(/\s{2,}|\t/).filter(Boolean)
    const line = cells.join(' ').replace(/\s+/g, ' ')
    if (!line) continue
    let m = line.match(TERM_HEADING)
    if (m) {
      current = { termCode: `1${m[2].slice(2)}${SEASON_DIGIT[m[1]]}`, workTerm: false, courses: [] }
      summary.terms.push(current)
      inTransfer = false
      continue
    }
    if (/^Transfer Credits$/i.test(line)) {
      inTransfer = true
      current = null
      continue
    }
    if (/^(Milestones|Scholarships and Awards|End of Undergraduate)/i.test(line)) {
      current = null
      inTransfer = false
      continue
    }
    if ((m = line.match(/^Program:\s*(.+)$/))) {
      summary.program = m[1].trim()
      continue
    }
    // Grade report header: "<level> <program>, Honours, …".
    if (!current && (m = line.match(/^\d[A-D] (.+,.*)$/))) {
      summary.program = m[1].trim()
      continue
    }
    if ((m = line.match(/^Level:\s*(\w{2,})/))) {
      if (current) {
        current.level = m[1]
        if (/Co-op Work Term/i.test(line)) current.workTerm = true
      }
      continue
    }
    if (line.includes('=')) {
      // Only simple one-to-one clauses; "SE 101 + COOP1 = PD1" style combinations are ignored.
      for (const clause of line.split(',')) {
        const e = clause.trim().match(EQUIVALENCE)
        if (e && `${e[1]}${e[2]}` !== `${e[3]}${e[4]}`) {
          summary.equivalences.push({ from: `${e[1]}${e[2]}`, to: `${e[3]}${e[4]}` })
        }
      }
      continue
    }
    const row = parseCourseRow(cells, line)
    if (!row) continue
    const code = `${row.subject}${row.number}`
    if (row.subject === 'SEQ') {
      // "SEQ 4  Co-op Sequence 4": the student's study/work sequence.
      const id = row.number === '6CA' ? 'cpa' : `coop${row.number}`
      if (id in SEQUENCES) summary.sequenceHint = id as SequenceId
    } else if (inTransfer || (row.transferCredit && current)) {
      summary.transfer.push({ code, title: row.title, status: 'transfer' })
    } else if (current) {
      current.courses.push({
        code,
        title: row.title,
        ...(row.grade && { grade: row.grade }),
        status: courseStatus(row.earned, row.grade),
      })
      if (row.subject === 'COOP') current.workTerm = true
    }
  }
  // The grade report lists the newest term first.
  summary.terms.sort((a, b) => a.termCode.localeCompare(b.termCode))
  return summary
}

/**
 * Major named in the transcript program line ("Statistics, Honours, Co-operative Program"):
 * the field of study before any "/specialization". Names shared by two degrees (Computer
 * Science, Data Science) keep `current` when it matches, else the first registered major.
 */
export function detectMajor(program: string | undefined, current: string): string | null {
  const field = program?.split(',')[0].split('/')[0].trim().toLowerCase()
  if (!field) return null
  const matches = Object.values(MAJORS).filter((m) => m.name.split(' (')[0].toLowerCase() === field)
  return (matches.find((m) => m.id === current) ?? matches[0])?.id ?? null
}

/** Specializations named in the transcript program line ("…/Digital Hardware Option"), among `allowed`. */
export function detectSpecs(program: string | undefined, allowed: SpecId[]): SpecId[] {
  if (!program) return []
  const lower = program.toLowerCase()
  return allowed.filter((id) => lower.includes(SPECS[id].shortName.toLowerCase()))
}

/** Number of terms from `from` to `to` (both term codes, `from` ≤ `to`). */
export function termOffset(from: string, to: string): number {
  let n = 0
  for (let code = from; code < to; code = nextTermCode(code)) n++
  return n
}

/** The stated sequence ("SEQ 4") if any, else the candidate pattern that best matches the transcript terms. */
export function inferSequence(summary: TranscriptSummary, fallback: SequenceId, candidates: SequenceId[]): SequenceId {
  if (summary.sequenceHint && candidates.includes(summary.sequenceHint)) return summary.sequenceHint
  if (summary.terms.length === 0) return fallback
  const start = summary.terms[0].termCode
  let best: { id: SequenceId; score: number } = { id: fallback, score: -Infinity }
  for (const id of candidates) {
    const pattern = SEQUENCES[id].pattern
    let score = 0
    for (const t of summary.terms) {
      const p = pattern[termOffset(start, t.termCode)]
      score += p !== undefined && p !== 'off' && (p === 'WT') === t.workTerm ? 1 : -1
    }
    // Prefer the user's current sequence on ties.
    if (score > best.score || (score === best.score && id === fallback)) best = { id, score }
  }
  return best.id
}

export interface TranscriptImportOptions {
  major: string
  sequence: SequenceId
  specs: SpecId[]
  /** `from` codes of equivalence notes to apply ("ECE 222=CS 251" → place CS 251 instead). */
  equivalences: CourseCode[]
}

/**
 * Equivalences applied by default: those whose original course does not already
 * fill a requirement of the chosen programs (e.g. keep ECE 222 under Digital Hardware).
 */
export function defaultEquivalences(
  summary: TranscriptSummary,
  programs: Program[],
  idx: CatalogIndex,
): CourseCode[] {
  const overrides = programs.flatMap((p) => p.coreOverrides ?? [])
  const used = new Set(
    programs.flatMap((p) =>
      programVariants(p, p.kind === 'core' ? overrides : []).flatMap((v) => v.slots.flatMap((s) => [...expandSet(s.from, idx)])),
    ),
  )
  return summary.equivalences.filter((e) => !used.has(e.from)).map((e) => e.from)
}

/** Subjects renamed since older transcripts; applied only when the new code exists. */
const SUBJECT_RENAMES: Record<string, string> = { SPCOM: 'COMMST' }

export interface TranscriptImportResult {
  plan: Plan
  placed: { termId: string; code: CourseCode; status: TranscriptCourseStatus }[]
  skipped: { code: CourseCode; termCode?: string; reason: string }[]
}

const UNTRACKED_SUBJECTS = new Set(['COOP', 'WKRPT'])

/**
 * Merge a parsed transcript into a plan: terms covered by the transcript are
 * replaced, later planned terms are kept (minus courses now on the transcript),
 * and `completedThrough` moves to the term before the first in-progress term.
 */
export function planFromTranscript(
  plan: Plan,
  summary: TranscriptSummary,
  idx: CatalogIndex,
  options: TranscriptImportOptions,
): TranscriptImportResult {
  const placed: TranscriptImportResult['placed'] = []
  const skipped: TranscriptImportResult['skipped'] = []
  const startTerm = summary.terms[0]?.termCode ?? plan.startTerm
  const patternLength = SEQUENCES[options.sequence].pattern.length
  const equivalent = new Map(
    summary.equivalences.filter((e) => options.equivalences.includes(e.from)).map((e) => [e.from, e.to]),
  )
  const placements: Plan['placements'] = {}
  const seen = new Set<CourseCode>()

  const accept = (course: TranscriptCourse, termId: string, termCode?: string) => {
    let code = equivalent.get(course.code) ?? course.code
    // Older codes: renamed subjects (SPCOM → COMMST) and dropped "R" suffixes (EMLS 129R → EMLS 129).
    for (const candidate of [code.replace(/^[A-Z]+/, (s) => SUBJECT_RENAMES[s] ?? s), code.replace(/R$/, '')]) {
      if (!idx.byCode.has(code) && idx.byCode.has(candidate)) code = candidate
    }
    const subject = code.match(/^[A-Z]+/)?.[0] ?? ''
    let reason: string | null = null
    if (course.status === 'failed') reason = `No credit (${course.grade ?? 'failed'})`
    else if (UNTRACKED_SUBJECTS.has(subject)) reason = 'Co-op / work-report credit (not tracked)'
    else if (/XX$/.test(code)) reason = 'Unspecified transfer credit (no specific course)'
    else if (!idx.byCode.has(code)) reason = 'Not in the 2026/27 calendar'
    else if (seen.has(code)) reason = 'Repeated course (kept the first attempt)'
    if (reason) {
      skipped.push({ code: course.code, ...(termCode && { termCode }), reason })
      return
    }
    seen.add(code)
    placements[termId] = [...(placements[termId] ?? []), code]
    placed.push({ termId, code, status: course.status })
  }

  for (const c of summary.transfer) accept(c, TRANSFER_TERM_ID)
  let lastIndex = -1
  let firstInProgress = Infinity
  for (const term of summary.terms) {
    const index = termOffset(startTerm, term.termCode)
    if (index >= patternLength) {
      term.courses.forEach((c) =>
        skipped.push({ code: c.code, termCode: term.termCode, reason: 'Term beyond the selected sequence' }),
      )
      continue
    }
    lastIndex = Math.max(lastIndex, index)
    if (term.courses.some((c) => c.status === 'in-progress')) firstInProgress = Math.min(firstInProgress, index)
    term.courses.forEach((c) => accept(c, `t${index}`, term.termCode))
  }

  // Keep planned courses in later terms when indices still line up (same 1A term).
  if (plan.startTerm === startTerm) {
    for (const [termId, codes] of Object.entries(plan.placements)) {
      if (termId === TRANSFER_TERM_ID || Number(termId.slice(1)) <= lastIndex) continue
      const kept = codes.filter((c) => !seen.has(c))
      if (kept.length) placements[termId] = kept
    }
  }
  // Without a transfer table on the transcript, keep manually entered transfer credit.
  const manualTransfer = summary.transfer.length ? [] : (plan.placements[TRANSFER_TERM_ID] ?? []).filter((c) => !seen.has(c))
  if (manualTransfer.length) placements[TRANSFER_TERM_ID] = manualTransfer

  return {
    plan: {
      ...plan,
      major: options.major,
      sequence: options.sequence,
      startTerm,
      specs: options.specs,
      placements,
      completedThrough: Number.isFinite(firstInProgress) ? firstInProgress - 1 : lastIndex,
    },
    placed,
    skipped,
  }
}
