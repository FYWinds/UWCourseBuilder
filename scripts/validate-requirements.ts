/**
 * Check the hand-maintained requirement DSL against the catalog snapshot:
 *  1. every listed course exists in public/data/catalog.json;
 *  2. every course linked in the Kuali program pages appears in the DSL (drift check).
 *
 * Usage: pnpm data:validate (after pnpm data:kuali && pnpm data:build)
 */
import { readFile } from 'node:fs/promises'
import { parse } from 'node-html-parser'
import type { CourseSet, Program } from '../src/domain/requirements.ts'
import type { Catalog } from '../src/domain/types.ts'
import { bcsCore, coopProgram } from '../src/requirements/bcs.ts'
import { SPECS } from '../src/requirements/specs.ts'
import { OUT_DIR, RAW_DIR } from './lib/config.ts'

function listedCodes(set: CourseSet, out = new Set<string>()): Set<string> {
  if ('list' in set) set.list.forEach((c) => out.add(c))
  else if ('union' in set) set.union.forEach((s) => listedCodes(s, out))
  else if ('intersect' in set) set.intersect.forEach((s) => listedCodes(s, out))
  else if ('minus' in set) listedCodes(set.minus[0], out)
  return out
}

function programCodes(program: Program): Set<string> {
  const out = new Set<string>()
  for (const section of program.sections) {
    for (const slot of section.slots) {
      listedCodes(slot.from, out)
      slot.maxFrom?.forEach((m) => listedCodes(m.set, out))
    }
  }
  program.coreOverrides?.forEach((o) => o.add.forEach((c) => out.add(c)))
  return out
}

async function kualiCodes(key: string): Promise<Set<string>> {
  const program = JSON.parse(await readFile(`${RAW_DIR}/kuali/programs/${key}.json`, 'utf8')) as Record<string, unknown>
  const html = ['courseRequirementsNoUnits', 'courseListsNew']
    .map((field) => program[field])
    .filter((v): v is string => typeof v === 'string')
    .join('')
  return new Set(
    parse(html)
      .querySelectorAll('a')
      .filter((a) => (a.getAttribute('href') ?? '').includes('/courses/'))
      .map((a) => a.text.replace(/\s+/g, '')),
  )
}

async function main() {
  const catalog = JSON.parse(await readFile(`${OUT_DIR}/catalog.json`, 'utf8')) as Catalog
  const known = new Set(catalog.courses.map((c) => c.code))
  const checks: [string, Program[]][] = [
    ['bcs-major', [bcsCore]],
    ['bcs-degree', [bcsCore, coopProgram]],
    ...Object.entries(SPECS).map(([id, p]): [string, Program[]] => [`spec-${id}`, [p]]),
  ]
  let problems = 0
  for (const [key, programs] of checks) {
    const dsl = new Set(programs.flatMap((p) => [...programCodes(p)]))
    const missingInCatalog = [...dsl].filter((c) => !known.has(c))
    const kuali = await kualiCodes(key)
    const missingInDsl = [...kuali].filter((c) => !dsl.has(c))
    if (missingInCatalog.length) console.log(`${key}: not in catalog: ${missingInCatalog.join(', ')}`)
    if (missingInDsl.length) console.log(`${key}: in calendar but not in DSL: ${missingInDsl.join(', ')}`)
    problems += missingInCatalog.length + missingInDsl.length
    if (!missingInCatalog.length && !missingInDsl.length) console.log(`${key}: ok (${kuali.size} calendar links)`)
  }
  if (problems) process.exitCode = 1
}

await main()
