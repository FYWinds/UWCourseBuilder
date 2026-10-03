/**
 * Snapshot term offerings from UW Open Data API v3. Requires UW_API_KEY
 * (put it in .env.local; never commit it). Raw responses are cached under
 * data/raw/opendata.
 *
 * Usage: pnpm data:opendata [--refresh]
 */
import { writeFile } from 'node:fs/promises'
import { NotFoundError, cachedJson, fetchJson, pool, progress } from './lib/http.ts'
import { OFFERING_TERMS, ONLINE_SCAN_TERMS, OPENDATA_BASE, RAW_DIR } from './lib/config.ts'

const refresh = process.argv.includes('--refresh')
const dir = `${RAW_DIR}/opendata`
const key = process.env.UW_API_KEY
if (!key) {
  console.error('UW_API_KEY is not set (expected in .env.local).')
  process.exit(1)
}

/** GET a list endpoint; Open Data answers 404 for "no data" (e.g. an unscheduled term). */
async function getList<T>(path: string): Promise<T[]> {
  try {
    return await fetchJson<T[]>(`${OPENDATA_BASE}/${path}`, { headers: { 'X-API-KEY': key! } })
  } catch (err) {
    if (err instanceof NotFoundError) return []
    throw err
  }
}

interface OdCourse {
  courseId: string
  associatedAcademicCareer: string
  subjectCode: string
  catalogNumber: string
}

interface OdClass {
  courseComponent: string
  scheduleData: { locationName: string | null }[] | null
}

async function main() {
  for (const term of OFFERING_TERMS) {
    const courses = await cachedJson(
      `${dir}/courses-${term}.json`,
      () => getList<OdCourse>(`Courses/${term}`),
      refresh,
    )
    const scheduled = await cachedJson(
      `${dir}/scheduled-${term}.json`,
      () => getList<string>(`ClassSchedules/${term}`),
      refresh,
    )
    console.log(`  ${term}: ${courses.length} catalog rows, ${scheduled.length} scheduled`)
  }

  for (const term of ONLINE_SCAN_TERMS) {
    const courses = await cachedJson<OdCourse[]>(`${dir}/courses-${term}.json`, async () => [])
    const scheduled = new Set(
      await cachedJson<string[]>(`${dir}/scheduled-${term}.json`, async () => []),
    )
    // Cross-listed courses share one courseId; scan each id once and cache per id
    // so a rate-limited run resumes where it stopped.
    const ids = [
      ...new Set(
        courses
          .filter((c) => c.associatedAcademicCareer === 'UG' && scheduled.has(c.courseId))
          .map((c) => c.courseId),
      ),
    ]
    const flags = await pool(
      ids,
      2,
      (id) =>
        cachedJson<boolean>(`${dir}/online/${term}/${id}.json`, async () => {
          const classes = await getList<OdClass>(`ClassSchedules/${term}/${id}`)
          return classes.some(
            (cl) =>
              cl.courseComponent === 'LEC' &&
              cl.scheduleData?.some((s) => s.locationName?.startsWith('ONLN')),
          )
        }, refresh),
      progress(`online scan ${term}`),
    )
    const onlineIds = new Set(ids.filter((_, i) => flags[i]))
    const online = [
      ...new Set(
        courses
          .filter((c) => onlineIds.has(c.courseId))
          .map((c) => `${c.subjectCode}${c.catalogNumber}`),
      ),
    ]
    await writeFile(`${dir}/online-${term}.json`, JSON.stringify(online))
    console.log(`  ${term}: ${online.length} undergraduate courses with online lectures`)
  }
}

await main()
