/**
 * Snapshot term offerings from UW Open Data API v3: two requests per term (catalog
 * rows and scheduled course ids). Requires UW_API_KEY (put it in .env.local; never
 * commit it). Raw responses are cached under data/raw/opendata.
 *
 * Usage: pnpm data:opendata [--refresh]
 */
import { NotFoundError, cachedJson, fetchJson } from './lib/http.ts'
import { OFFERING_TERMS, OPENDATA_BASE, RAW_DIR } from './lib/config.ts'

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

for (const term of OFFERING_TERMS) {
  const courses = await cachedJson(`${dir}/courses-${term}.json`, () => getList<unknown>(`Courses/${term}`), refresh)
  const scheduled = await cachedJson(`${dir}/scheduled-${term}.json`, () => getList<string>(`ClassSchedules/${term}`), refresh)
  console.log(`  ${term}: ${courses.length} catalog rows, ${scheduled.length} scheduled`)
}
