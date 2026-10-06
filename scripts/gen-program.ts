/**
 * Draft a major's requirement module from its Kuali program page. The output is a
 * starting point for review, not a source of truth: rules the generator cannot
 * express become `notes` marked "MANUAL:" and are listed in the report.
 *
 * Usage: pnpm tsx scripts/gen-program.ts <pid> <id> "<short name>" [--force]
 * Writes src/requirements/math/<id>.ts (refuses to overwrite without --force).
 */
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { type HTMLElement, type Node, NodeType, parse } from 'node-html-parser'
import { KUALI_BASE, KUALI_CATALOG_ID, RAW_DIR } from './lib/config.ts'
import { cachedJson, fetchJson } from './lib/http.ts'

interface Course {
  code: string
  units: number
}

type RuleNode =
  | { kind: 'section'; label: string; children: RuleNode[] }
  | { kind: 'group'; need: 'all' | number; children: RuleNode[] }
  | { kind: 'rule'; text: string; courses: Course[] }

/** A generated slot as TypeScript source, with the facts needed to merge alternatives. */
interface DraftSlot {
  units: number
  required: boolean
  /** CourseSet literal (TS source). */
  set: string
  label: string
  /** Single-course or one-of slot: emitted with oneOf(). */
  codes?: string[]
}

const isElement = (n: Node): n is HTMLElement => n.nodeType === NodeType.ELEMENT_NODE

/** Rule text up to its course list; text-only rules wrap the text in a plain <div>. */
function textBefore(result: HTMLElement): string {
  let out = ''
  for (const child of result.childNodes) {
    if (isElement(child) && (child.tagName === 'UL' || child.querySelector('ul'))) break
    out += child.nodeType === NodeType.COMMENT_NODE ? '' : child.text
  }
  return out.replace(/\s+/g, ' ').trim()
}

function coursesIn(el: HTMLElement): Course[] {
  return el
    .querySelectorAll('a')
    .filter((a) => (a.getAttribute('href') ?? '').includes('/courses/'))
    .map((a) => {
      const units = a.parentNode?.text.match(/\((\d+\.\d+)\)/)
      return { code: a.text.replace(/\s+/g, ''), units: units ? Number(units[1]) : 0.5 }
    })
}

function walk(el: HTMLElement): RuleNode[] {
  const out: RuleNode[] = []
  for (const child of el.childNodes.filter(isElement)) {
    if (child.tagName === 'SECTION') {
      const label = child.querySelector('h2, h3, h4')?.text.trim() ?? ''
      const body = child.childNodes.filter(isElement).filter((c) => c.tagName !== 'HEADER')
      out.push({ kind: 'section', label, children: body.flatMap(walk) })
    } else if (child.tagName === 'LI') {
      out.push(...walkItem(child))
    } else if (child.tagName !== 'HEADER') {
      out.push(...walk(child))
    }
  }
  return out
}

function walkItem(li: HTMLElement): RuleNode[] {
  if ((li.getAttribute('data-test') ?? '').startsWith('ruleView')) {
    const result = li.querySelector('[data-test$="-result"]') ?? li
    return [{ kind: 'rule', text: textBefore(result), courses: coursesIn(result) }]
  }
  const head = li.childNodes.filter(isElement).find((c) => c.tagName === 'SPAN')
  const m = head?.text.replace(/\s+/g, ' ').match(/^Complete (all|\d+) of the following/)
  if (m) {
    const list = li.childNodes.filter(isElement).filter((c) => c.tagName !== 'SPAN')
    return [{ kind: 'group', need: m[1] === 'all' ? 'all' : Number(m[1]), children: list.flatMap(walk) }]
  }
  return walk(li)
}

const quote = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const listSet = (codes: string[]) => `{ list: [${codes.map(quote).join(', ')}] }`

/** "300- or 400-level", "400-level", "300-level or above" → numeric range. */
function levelRange(text: string): [number, number] | null {
  let m = text.match(/(\d)00- or (\d)00-level/)
  if (m) return [Number(m[1]) * 100, Number(m[2]) * 100 + 99]
  m = text.match(/(\d)00-level or (?:above|higher)/)
  if (m) return [Number(m[1]) * 100, 499]
  m = text.match(/(\d)00-level/)
  if (m) return [Number(m[1]) * 100, Number(m[1]) * 100 + 99]
  return null
}

/** Course set described in a text rule (subjects, levels, explicit ranges), or null. */
function textSet(text: string): string | null {
  // "CS340-CS398, CS440-CS489" or "GSJ 400 - 499".
  const ranges = [...text.matchAll(/\b([A-Z]{2,})\s?(\d{3})\s?-\s?(?:[A-Z]{2,})?\s?(\d{3})\b/g)]
  const extra: string[] = []
  if (/any CS course at the 600- or 700-level/.test(text)) extra.push(`{ range: { subject: 'CS', from: 600, to: 799 } }`)
  if (ranges.length) {
    const parts = ranges.map(([, s, a, b]) => `{ range: { subject: '${s}', from: ${a}, to: ${b} } }`)
    const all = [...parts, ...extra]
    return all.length === 1 ? all[0] : `{ union: [${all.join(', ')}] }`
  }
  const listed = text.match(/(?:subject codes|from):\s*([A-Z]{2,}(?:,\s*[A-Z]{2,})*)/)
  const lead = text.match(/(?:units?|courses?) of ([A-Z]{2,}(?: or [A-Z]{2,})?) courses?|\b(?:additional )?([A-Z]{2,}(?: or [A-Z]{2,})?) courses?\b/)
  const subjects = listed
    ? listed[1].split(/,\s*/)
    : lead
      ? (lead[1] ?? lead[2]).split(' or ')
      : null
  if (!subjects || subjects.some((s) => !/^[A-Z]{2,}$/.test(s))) return null
  const range = levelRange(text)
  if (!range) return `{ subject: [${subjects.map(quote).join(', ')}] }`
  const parts = subjects.map((s) => `{ range: { subject: '${s}', from: ${range[0]}, to: ${range[1]} } }`)
  return parts.length === 1 ? parts[0] : `{ union: [${parts.join(', ')}] }`
}

/** Units asked for by a text rule ("2 STAT courses", "1.5 additional units"). */
function textUnits(text: string): number | null {
  const m = text.match(
    /(?:Complete|Choose)(?: at least)? (\d+(?:\.\d+)?) (?:additional )?(?:0\.5-unit )?(?:[A-Z]{2,} (?:or [A-Z]{2,} )?|math )?(units?|courses?)\b/,
  )
  if (!m) return null
  return m[2].startsWith('unit') ? Number(m[1]) : Number(m[1]) * 0.5
}

/** "Complete N of [groups]" whose groups are each expressible: one option per combination. */
interface DraftChoice {
  label: string
  options: { label: string; slots: DraftSlot[] }[]
}

interface Draft {
  slots: DraftSlot[]
  choices: DraftChoice[]
  manual: string[]
  excluded: string[]
  /** "no more than N from …" constraints, attached to the slots of the enclosing group. */
  caps: { codes: string[]; max: number }[]
}

/** k-element subsets of `items`, in order. */
function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]]
  return items.flatMap((item, i) => combinations(items.slice(i + 1), k - 1).map((rest) => [item, ...rest]))
}

const MAX_OPTIONS = 6

function convertRule(rule: Extract<RuleNode, { kind: 'rule' }>): Draft {
  const empty: Draft = { slots: [], choices: [], manual: [], excluded: [], caps: [] }
  const { text, courses } = rule
  const codes = courses.map((c) => c.code)
  const unitsOf = (cs: Course[]) => Math.min(...cs.map((c) => c.units))
  if (/^Complete all the following:?$/.test(text)) {
    return { ...empty, slots: courses.map((c) => ({ units: c.units, required: true, set: listSet([c.code]), label: c.code, codes: [c.code] })) }
  }
  let m = text.match(/^Complete (\d+) of the following:?$/)
  if (m && courses.length) {
    const n = Number(m[1])
    return n === 1
      ? { ...empty, slots: [{ units: unitsOf(courses), required: true, set: listSet(codes), label: codes.join(' / '), codes }] }
      : { ...empty, slots: [{ units: n * 0.5, required: false, set: listSet(codes), label: `${n} of ${codes.join(', ')}` }] }
  }
  m = text.match(/^Complete (\d+(?:\.\d+)?) units? from the following/)
  if (m && courses.length) {
    return { ...empty, slots: [{ units: Number(m[1]), required: false, set: listSet(codes), label: `${m[1]} units from ${codes.join(', ')}` }] }
  }
  m = text.match(/^Complete no more than (\d+) from the following/)
  if (m && courses.length) return { ...empty, caps: [{ codes, max: Number(m[1]) }] }
  if (/^The following cannot be used towards this academic plan/.test(text)) return { ...empty, excluded: codes }
  if (/^Choose any of the following:?$/.test(text) && courses.length) {
    // Only meaningful as an alternative inside "Complete 1 of": a pool of equal-unit choices.
    return { ...empty, slots: [{ units: 0, required: false, set: listSet(codes), label: codes.join(', ') }] }
  }
  const set = textSet(text)
  const units = textUnits(text) ?? (/^Choose any course from the following/.test(text) ? 0 : null)
  if (set && units !== null && !/approved|see Additional Constraints|only one|seminar|lecture/i.test(text)) {
    return { ...empty, slots: [{ units, required: false, set, label: text.replace(/^Complete /, '').replace(/\.$/, '') }] }
  }
  return { ...empty, manual: [text + (codes.length ? `: ${codes.join(', ')}` : '')] }
}

function describe(node: RuleNode): string {
  if (node.kind === 'rule') return node.text + (node.courses.length ? ` (${node.courses.map((c) => c.code).join(', ')})` : '')
  if (node.kind === 'group') return `${node.need === 'all' ? 'all' : node.need} of [${node.children.map(describe).join('; ')}]`
  return node.label
}

function convert(node: RuleNode): Draft {
  if (node.kind === 'rule') return convertRule(node)
  const parts = node.children.map(convert)
  const merged: Draft = {
    slots: parts.flatMap((p) => p.slots),
    choices: parts.flatMap((p) => p.choices),
    manual: parts.flatMap((p) => p.manual),
    excluded: parts.flatMap((p) => p.excluded),
    caps: parts.flatMap((p) => p.caps),
  }
  if (node.kind !== 'group' || node.need === 'all') return merged
  // "Complete 1 of": alternatives that are each one slot of equal units merge into a union slot.
  const options = parts.map((p) => p.slots)
  const units = [...new Set(options.flat().map((s) => s.units).filter((u) => u > 0))]
  if (node.need === 1 && options.every((o) => o.length === 1) && merged.manual.length === 0 && units.length === 1) {
    const sets = options.map((o) => o[0].set)
    return {
      ...merged,
      slots: [{ units: units[0], required: false, set: `{ union: [${sets.join(', ')}] }`, label: `One of: ${options.map((o) => o[0].label).join(' | ')}` }],
    }
  }
  // Paths made of different course groups: a choice with one option per combination of N groups.
  const expressible = merged.manual.length === 0 && merged.choices.length === 0 && options.every((o) => o.some((s) => s.units > 0))
  const combos = combinations(options, node.need)
  if (expressible && combos.length <= MAX_OPTIONS) {
    return {
      ...merged,
      slots: [],
      choices: [
        {
          label: node.need === 1 ? 'One of these paths' : `${node.need} of these ${options.length} groups`,
          options: combos.map((combo) => ({ label: combo.flat().map((s) => s.label).join(' + '), slots: combo.flat() })),
        },
      ],
    }
  }
  return { slots: [], choices: [], manual: [describe(node)], excluded: merged.excluded, caps: [] }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function htmlText(html: unknown): string[] {
  if (typeof html !== 'string') return []
  return parse(html.replace(/<(li|p|div|br)[^>]*>/g, '\n'))
    .text.split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

async function main() {
  const [pid, id, shortName] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  if (!pid || !id || !shortName) throw new Error('Usage: gen-program.ts <pid> <id> "<short name>" [--force]')
  const out = `src/requirements/math/${id}.ts`
  if (existsSync(out) && !process.argv.includes('--force')) throw new Error(`${out} exists (use --force)`)

  const program = await cachedJson<Record<string, unknown>>(`${RAW_DIR}/kuali/programs/${pid}.json`, () =>
    fetchJson(`${KUALI_BASE}/program/${KUALI_CATALOG_ID}/${pid}`),
  )
  const html = ['courseRequirementsNoUnits', 'requirements', 'courseListsNew', 'specializationsYesrequired']
    .map((f) => program[f])
    .filter((v): v is string => typeof v === 'string')
    .join('')
  const tree = walk(parse(html))
  const sections = (tree.some((n) => n.kind === 'section') ? tree : [{ kind: 'section', label: 'Required courses', children: tree } as RuleNode]).filter(
    (n): n is Extract<RuleNode, { kind: 'section' }> => n.kind === 'section',
  )

  const grad = htmlText(program.graduationRequirements)
  const mathUnits = Number(grad.join(' ').match(/minimum of (\d+(?:\.\d+)?) units of math courses/)?.[1] ?? 'NaN')
  const degree = grad.join(' ').includes('Bachelor of Computer Science') ? 'bcs' : 'bmath'
  const manual: string[] = []
  const excluded: string[] = []
  const used = new Set<string>()
  const slotId = (base: string) => {
    let candidate = base
    for (let i = 2; used.has(candidate); i++) candidate = `${base}-${i}`
    used.add(candidate)
    return candidate
  }

  const sectionSource = sections.map((section) => {
    const draft = convert(section)
    manual.push(...draft.manual.map((m) => `${section.label}: ${m}`))
    excluded.push(...draft.excluded)
    const sid = slug(section.label) || 'required'
    const capNote = draft.caps.map((c) => `MANUAL: no more than ${c.max} from ${c.codes.join(', ')}`)
    manual.push(...capNote)
    const emit = (s: DraftSlot, i: number, prefix: string, indent: string) => {
      if (s.codes && s.required) {
        const unitsArg = s.units === 0.5 ? '' : `, ${s.units}`
        return `${indent}oneOf(${quote(slotId(s.codes[0].toLowerCase()))}, [${s.codes.map(quote).join(', ')}]${unitsArg}),`
      }
      const count = s.units / 0.5
      const set = excluded.length ? `{ minus: [${s.set}, EXCLUDED] }` : s.set
      return Number.isInteger(count)
        ? `${indent}pick(${quote(slotId(`${prefix}-${i + 1}`))}, ${quote(s.label)}, ${count}, ${set}),`
        : `${indent}{ id: ${quote(slotId(`${prefix}-${i + 1}`))}, label: ${quote(s.label)}, units: ${s.units}, from: ${set}, kind: 'elective' },`
    }
    const body = draft.slots.filter((s) => s.units > 0).map((s, i) => emit(s, i, sid, '        '))
    const choices = draft.choices.map((c, ci) => {
      const cid = slotId(`${sid}-choice-${ci + 1}`)
      const options = c.options.map((o, oi) => {
        const slots = o.slots.filter((s) => s.units > 0).map((s, i) => emit(s, i, `${cid}-${oi + 1}`, '                '))
        return `            {\n              id: ${quote(`${cid}-${oi + 1}`)},\n              label: ${quote(o.label)},\n              slots: [\n${slots.join('\n')}\n              ],\n            },`
      })
      return `        {\n          id: ${quote(cid)},\n          label: ${quote(c.label)},\n          options: [\n${options.join('\n')}\n          ],\n        },`
    })
    const choiceSource = choices.length ? `\n      choices: [\n${choices.join('\n')}\n      ],` : ''
    return `    {\n      id: ${quote(sid)},\n      label: ${quote(section.label)},\n      slots: [\n${body.join('\n')}\n      ],${choiceSource}\n    },`
  })

  const constraints = htmlText(program.additionalConstraints)
  const builder = degree === 'bcs' ? 'bcsDegreeMajor' : 'bmathMajor'
  const source = `/**
 * ${program.title as string}.
 * Drafted by scripts/gen-program.ts from Kuali ${pid}, then reviewed against the calendar.
 */
import type { Major } from '@/domain/requirements'
import { ${builder} } from '../${degree === 'bcs' ? 'bcs' : 'bmath'}'
import { oneOf, pick } from '../helpers'
${excluded.length ? `\n/** "The following cannot be used towards this academic plan." */\nconst EXCLUDED = { list: [${excluded.map(quote).join(', ')}] }\n` : ''}
export const major: Major = ${builder}({
  id: ${quote(id)},
  pid: ${quote(pid)},
  name: ${quote(program.title as string)},
  shortName: ${quote(shortName)},
  enrolmentCode: ${quote(program.code as string)},
  mathUnits: ${mathUnits},
  sections: [
${sectionSource.join('\n')}
  ],
  notes: [
${[...constraints, ...manual.map((m) => (m.startsWith('MANUAL') ? m : `MANUAL: ${m}`))].map((n) => `    ${quote(n)},`).join('\n')}
  ],
})
`
  await writeFile(out, source)
  console.log(`${id}: ${out} — math units ${mathUnits}, ${manual.length} manual item(s)`)
  for (const m of manual) console.log(`  ${m}`)
}

await main()
