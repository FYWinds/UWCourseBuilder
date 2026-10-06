/**
 * Snapshot the 2026/27 Undergraduate Calendar from the Kuali catalog API
 * (the backend of https://uwaterloo.ca/academic-calendar/undergraduate-studies/catalog).
 * No API key is needed. Raw responses are cached under data/raw/kuali.
 *
 * Usage: pnpm data:kuali [--refresh]
 */
import { cachedJson, fetchJson, pool, progress } from './lib/http.ts'
import { KUALI_BASE, KUALI_CATALOG_ID, RAW_DIR } from './lib/config.ts'
import { calendarChecks } from './lib/programs.ts'

const refresh = process.argv.includes('--refresh')
const dir = `${RAW_DIR}/kuali`

interface KualiIndexEntry {
  __catalogCourseId: string
  pid: string
}

async function main() {
  console.log(`Kuali catalog ${KUALI_CATALOG_ID}`)
  const index = await cachedJson<KualiIndexEntry[]>(
    `${dir}/courses-index.json`,
    () => fetchJson(`${KUALI_BASE}/courses/${KUALI_CATALOG_ID}`),
    refresh,
  )
  console.log(`  ${index.length} courses in index`)

  const failures: string[] = []
  await pool(
    index,
    8,
    async (c) => {
      try {
        await cachedJson(
          `${dir}/courses/${c.__catalogCourseId}.json`,
          () => fetchJson(`${KUALI_BASE}/course/${KUALI_CATALOG_ID}/${c.pid}`),
          refresh,
        )
      } catch (err) {
        failures.push(`${c.__catalogCourseId}: ${(err as Error).message}`)
      }
    },
    progress('course details'),
  )

  const pids = [...new Set(calendarChecks().map((c) => c.pid))]
  await pool(
    pids,
    4,
    (pid) =>
      cachedJson(`${dir}/programs/${pid}.json`, () => fetchJson(`${KUALI_BASE}/program/${KUALI_CATALOG_ID}/${pid}`), refresh),
    progress('program pages'),
  )
  console.log(`  ${pids.length} programs cached`)

  if (failures.length) {
    console.error(`${failures.length} course fetches failed:\n${failures.join('\n')}`)
    process.exitCode = 1
  }
}

await main()
