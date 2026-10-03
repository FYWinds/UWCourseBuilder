/**
 * Merge cached Kuali + Open Data snapshots into public/data/catalog.json.
 * Prints requisite parse coverage so regressions in the HTML grammar are visible.
 *
 * Usage: pnpm data:build
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import type { Catalog, Course, Faculty, Season } from '../src/domain/types.ts'
import {
  CALENDAR_LABEL,
  KUALI_CATALOG_ID,
  OFFERING_TERMS,
  ONLINE_SCAN_TERMS,
  OUT_DIR,
  RAW_DIR,
} from './lib/config.ts'
import { countKinds, parseAntirequisites, parseRequisite } from './lib/requisites.ts'

interface KualiCourse {
  __catalogCourseId: string
  title: string
  description?: string
  credits?: { value?: string }
  subjectCode: { name: string }
  prerequisites?: string
  corequisites?: string
  antirequisites?: string
  crossListedCourses?: { __catalogCourseId: string }[]
  notes?: string
}

interface OdCourse {
  courseId: string
  subjectCode: string
  catalogNumber: string
  associatedAcademicGroupCode: string
}

const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, 'utf8')) as T

/** Open Data academic group → faculty. Affiliated/federated colleges teach Arts subjects. */
const GROUP_TO_FACULTY: Record<string, Faculty> = {
  MAT: 'MAT',
  ENG: 'ENG',
  ART: 'ART',
  REN: 'ART',
  CGC: 'ART',
  STJ: 'ART',
  STP: 'ART',
  THL: 'ART',
  ENV: 'ENV',
  AHS: 'AHS',
  SCI: 'SCI',
}

const SEASON_BY_DIGIT: Record<string, Season> = { '1': 'W', '5': 'S', '9': 'F' }

function stripHtml(html: string | undefined): string | undefined {
  const text = html
    ?.replace(/<li>/g, '• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text || undefined
}

async function main() {
  const kualiDir = `${RAW_DIR}/kuali/courses`
  const files = (await readdir(kualiDir)).filter((f) => f.endsWith('.json'))
  const kuali = await Promise.all(files.map((f) => readJson<KualiCourse>(`${kualiDir}/${f}`)))

  // Faculty: most recent Open Data catalog row wins; fall back to the subject's majority faculty.
  const facultyByCode = new Map<string, Faculty>()
  const subjectVotes = new Map<string, Map<Faculty, number>>()
  // Offerings: which sampled terms scheduled each course code.
  const termsByCode = new Map<string, string[]>()
  for (const term of OFFERING_TERMS) {
    const coursesPath = `${RAW_DIR}/opendata/courses-${term}.json`
    if (!existsSync(coursesPath)) continue
    const rows = await readJson<OdCourse[]>(coursesPath)
    const scheduled = new Set(await readJson<string[]>(`${RAW_DIR}/opendata/scheduled-${term}.json`))
    for (const row of rows) {
      const code = `${row.subjectCode}${row.catalogNumber}`
      const faculty = GROUP_TO_FACULTY[row.associatedAcademicGroupCode] ?? 'OTHER'
      facultyByCode.set(code, faculty)
      const votes = subjectVotes.get(row.subjectCode) ?? new Map<Faculty, number>()
      votes.set(faculty, (votes.get(faculty) ?? 0) + 1)
      subjectVotes.set(row.subjectCode, votes)
      if (scheduled.has(row.courseId)) {
        const list = termsByCode.get(code) ?? []
        if (!list.includes(term)) list.push(term)
        termsByCode.set(code, list)
      }
    }
  }
  const online = new Set<string>()
  const scannedOnline: string[] = []
  for (const term of ONLINE_SCAN_TERMS) {
    const path = `${RAW_DIR}/opendata/online-${term}.json`
    if (!existsSync(path)) continue
    scannedOnline.push(term)
    for (const code of await readJson<string[]>(path)) online.add(code)
  }
  const subjectFaculty = (subject: string): Faculty => {
    const votes = subjectVotes.get(subject)
    if (!votes) return 'OTHER'
    return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0]
  }

  const kinds: Record<string, number> = {}
  const textSamples: string[] = []
  const courses: Course[] = kuali.map((k) => {
    const code = k.__catalogCourseId
    const subject = k.subjectCode.name
    const number = code.slice(subject.length)
    const prereq = parseRequisite(k.prerequisites)
    const coreq = parseRequisite(k.corequisites)
    const anti = parseAntirequisites(k.antirequisites)
    for (const r of [prereq, coreq]) {
      const before = kinds.text ?? 0
      countKinds(r, kinds)
      if ((kinds.text ?? 0) > before && textSamples.length < 40) textSamples.push(`${code}: ${JSON.stringify(r).slice(0, 220)}`)
    }
    const offeredTerms = (termsByCode.get(code) ?? []).sort()
    const offered = [...new Set(offeredTerms.map((t) => SEASON_BY_DIGIT[t[3]]))]
    return {
      code,
      subject,
      number,
      title: k.title,
      units: Number(k.credits?.value ?? '0.5'),
      level: Number(number.match(/^\d/)?.[0] ?? '0') * 100,
      faculty: facultyByCode.get(code) ?? subjectFaculty(subject),
      description: k.description ?? '',
      ...(prereq && { prereq }),
      ...(coreq && { coreq }),
      antireq: anti.codes,
      ...(anti.text.length && { antireqText: anti.text }),
      crossListed: (k.crossListedCourses ?? []).map((c) => c.__catalogCourseId),
      offered: (['F', 'W', 'S'] as Season[]).filter((s) => offered.includes(s)),
      offeredTerms,
      online: online.has(code),
      ...(stripHtml(k.notes) && { notes: stripHtml(k.notes) }),
    }
  })
  courses.sort((a, b) => a.subject.localeCompare(b.subject) || a.number.localeCompare(b.number, 'en', { numeric: true }))

  const catalog: Catalog = {
    meta: {
      calendar: CALENDAR_LABEL,
      catalogId: KUALI_CATALOG_ID,
      fetchedAt: new Date().toISOString(),
      offeringTerms: OFFERING_TERMS.filter((t) => existsSync(`${RAW_DIR}/opendata/courses-${t}.json`)),
      onlineScanTerms: scannedOnline,
      courseCount: courses.length,
    },
    courses,
  }
  await mkdir(OUT_DIR, { recursive: true })
  const json = JSON.stringify(catalog)
  await writeFile(`${OUT_DIR}/catalog.json`, json)

  const leafTotal = Object.entries(kinds)
    .filter(([k]) => k !== 'all' && k !== 'atLeast')
    .reduce((s, [, n]) => s + n, 0)
  console.log(`catalog.json: ${courses.length} courses, ${(json.length / 1e6).toFixed(2)} MB`)
  console.log(`requisite nodes: ${JSON.stringify(kinds)}`)
  console.log(`unstructured leaves: ${kinds.text ?? 0}/${leafTotal} (${(((kinds.text ?? 0) / leafTotal) * 100).toFixed(1)}%)`)
  console.log(`offerings: ${termsByCode.size} codes; online: ${online.size} codes over ${scannedOnline.join(',') || 'no terms'}`)
  if (process.argv.includes('--samples')) console.log(textSamples.join('\n'))
}

await main()
