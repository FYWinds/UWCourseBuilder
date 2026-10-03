/**
 * Parse Kuali "ruleView" requisite HTML into a Requisite AST.
 *
 * Shape of the HTML (2026/27 catalog):
 *   group: <li><span>Complete all|N of the following</span><ul>…children…</ul></li>
 *   leaf:  <li data-test="ruleView-X"><div data-test="ruleView-X-result">TEXT <div><ul>…course links…</ul></div></div></li>
 * Unrecognized leaves become `{ kind: 'text' }` so nothing is silently dropped.
 */
import { type HTMLElement, NodeType, parse } from 'node-html-parser'
import type { CourseCode, Requisite, TermLevel } from '../../src/domain/types.ts'

const norm = (s: string) =>
  s
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 }

function courseLinks(el: HTMLElement): CourseCode[] {
  return el
    .querySelectorAll('a')
    .filter((a) => (a.getAttribute('href') ?? '').includes('/courses/'))
    .map((a) => norm(a.text).replace(/\s+/g, ''))
}

function programLinks(el: HTMLElement): string[] {
  return el
    .querySelectorAll('a')
    .filter((a) => (a.getAttribute('href') ?? '').includes('/programs/'))
    .map((a) => norm(a.text))
}

/** Text of the leaf's own sentence, excluding the nested course list. */
function leadText(result: HTMLElement): string {
  return norm(
    result.childNodes
      .filter((n) => !(n.nodeType === NodeType.ELEMENT_NODE && (n as HTMLElement).tagName === 'DIV'))
      .map((n) => n.text)
      .join(' '),
  )
}

function coursesNode(
  codes: CourseCode[],
  n: number | 'all',
  extra: { minGrade?: number; concurrentOk?: boolean } = {},
): Requisite {
  const of: Requisite[] = codes.map((code) => ({ kind: 'course', code, ...extra }))
  if (of.length === 1 && (n === 'all' || n === 1)) return of[0]
  return n === 'all' ? { kind: 'all', of } : { kind: 'atLeast', n, of }
}

function parseLeaf(result: HTMLElement): Requisite {
  // Plain-text leaves wrap their sentence in a <div>, so the lead text can be empty.
  const text = leadText(result) || norm(result.text)
  const full = norm(result.text)
  // Inactive courses are listed as plain text instead of links: "…following: PHYS454, SI102R".
  const codes = courseLinks(result)
  if (codes.length === 0) {
    const tail = full.split(':')[1] ?? ''
    for (const m of tail.matchAll(/\b([A-Z]{2,}\d{3}[A-Z]{0,2})\b/g)) codes.push(m[1])
  }
  let m: RegExpMatchArray | null

  if ((m = text.match(/^Must have completed at least (\d+) of the following/i)) && codes.length)
    return coursesNode(codes, Number(m[1]))
  if (/^Must have completed( the following| all of the following)?:/i.test(text) && codes.length)
    return coursesNode(codes, 'all')
  if ((m = text.match(/^Completed or concurrently enrolled in at least (\d+) of the following/i)) && codes.length)
    return coursesNode(codes, Number(m[1]), { concurrentOk: true })
  if (/^Completed or concurrently enrolled in/i.test(text) && codes.length)
    return coursesNode(codes, 'all', { concurrentOk: true })
  if ((m = text.match(/^Earned a minimum grade of (\d+)% in at least (\d+) of the following/i)) && codes.length)
    return coursesNode(codes, Number(m[2]), { minGrade: Number(m[1]) })
  if ((m = text.match(/^Earned a minimum grade of (\d+)% in (each|all) of the following/i)) && codes.length)
    return coursesNode(codes, 'all', { minGrade: Number(m[1]) })
  if ((m = text.match(/^Earned a minimum grade of (\d+)% in/i)) && codes.length === 1)
    return coursesNode(codes, 'all', { minGrade: Number(m[1]) })
  if ((m = full.match(/^Students must be in level (\d[AB])( or higher)?$/i)))
    return { kind: 'level', min: m[1].toUpperCase() as TermLevel, ...(m[2] ? {} : { exact: true }) }
  if ((m = full.match(/^Earned a minimum cumulative average of (\d+(?:\.\d+)?)/i)))
    return { kind: 'average', min: Number(m[1]) }
  if (/^Not open to students enrolled in/i.test(full)) {
    const programs = programLinks(result)
    if (programs.length) return { kind: 'program', mode: 'notIn', programs }
  }
  if ((m = full.match(/^Enrolled in a program offered by (?:the )?(Faculty of [A-Za-z ]+?)\.?$/i)))
    return { kind: 'program', mode: 'in', programs: [m[1]] }
  if (/^Enrolled in/i.test(full)) {
    const programs = programLinks(result)
    if (programs.length) return { kind: 'program', mode: 'in', programs }
    const named = full
      .replace(/^Enrolled in\s*/i, '')
      .split(/\s*,\s*(?:or\s+)?|\s+or\s+/)
      .filter(Boolean)
    if (named.length && named.every((p) => /^(H|JH|NG|3G|4G|[A-Z]{2,4})-/.test(p)))
      return { kind: 'program', mode: 'in', programs: named }
  }
  if ((m = full.match(/^Enrolled in an? (Honours(?: [A-Za-z]+)?) program$/i)))
    return { kind: 'program', mode: 'in', programs: [m[1]] }
  if (/^Enrolled in a co-operative program$/i.test(full))
    return { kind: 'program', mode: 'in', programs: ['Co-operative'] }
  if (/^Enrolled in/i.test(full)) {
    // Free-text enrolment rules. Only phrases that clearly admit Faculty of Mathematics
    // honours students map to a token BCS students hold; the rest name other programs.
    const rest = full.replace(/^Enrolled in:?\s*/i, '')
    if (/undergraduate degree program/i.test(rest)) return { kind: 'program', mode: 'in', programs: ['Faculty of Mathematics'] }
    if (/Faculties of [^.]*Mathematics|Faculty of Mathematics/i.test(rest))
      return { kind: 'program', mode: 'in', programs: ['Faculty of Mathematics'] }
    if (/^Honours (Faculty of )?Mathematics\b/i.test(rest) || /\bHonours Mathematics program\b/i.test(rest))
      return { kind: 'program', mode: 'in', programs: ['Honours Mathematics'] }
    return { kind: 'program', mode: 'in', programs: [rest] }
  }
  if ((m = full.match(/^Earned at least (\d+(?:\.\d+)?) units? from ([A-Z]{2,})(?: (\d)00 - (\d)99)?$/)))
    return {
      kind: 'units',
      min: Number(m[1]),
      subject: m[2],
      ...(m[3] && { minLevel: Number(m[3]) * 100, maxLevel: Number(m[4]) * 100 }),
    }
  return { kind: 'text', raw: full }
}

function parseItem(li: HTMLElement): Requisite | null {
  const result = li.querySelector('[data-test$="-result"]')
  if (li.getAttribute('data-test')?.startsWith('ruleView') && result) return parseLeaf(result)

  const header = li.childNodes.find(
    (n): n is HTMLElement => n.nodeType === NodeType.ELEMENT_NODE && (n as HTMLElement).tagName === 'SPAN',
  )
  const list = li.childNodes.find(
    (n): n is HTMLElement => n.nodeType === NodeType.ELEMENT_NODE && (n as HTMLElement).tagName === 'UL',
  )
  if (header && list) {
    const children = parseList(list)
    const h = norm(header.text)
    if (/^Complete all/i.test(h)) return children.length === 1 ? children[0] : { kind: 'all', of: children }
    const m = h.match(/^Complete (\d+|one|two|three|four|five) of/i)
    if (m) {
      const n = Number(m[1]) || WORD_NUMBERS[m[1].toLowerCase()]
      return { kind: 'atLeast', n, of: children }
    }
    return { kind: 'text', raw: norm(li.text) }
  }
  const text = norm(li.text)
  return text ? { kind: 'text', raw: text } : null
}

/** List items, looking through the `<div><span class="rules_groupHeader…"/><li>` wrappers of nested groups. */
function listItems(ul: HTMLElement): HTMLElement[] {
  return ul.childNodes
    .filter((n): n is HTMLElement => n.nodeType === NodeType.ELEMENT_NODE)
    .flatMap((el) => (el.tagName === 'LI' ? [el] : el.tagName === 'DIV' ? listItems(el) : []))
}

function parseList(ul: HTMLElement): Requisite[] {
  return listItems(ul)
    .map(parseItem)
    .filter((r): r is Requisite => r !== null)
}

/** Parse a prerequisite/corequisite HTML blob. Returns undefined for empty input. */
export function parseRequisite(html: string | undefined): Requisite | undefined {
  if (!html?.trim()) return undefined
  const root = parse(html.replace(/<!-- -->/g, ''))
  const top = root.querySelector('ul')
  if (!top) {
    const raw = norm(root.text)
    return raw ? { kind: 'text', raw } : undefined
  }
  const items = parseList(top)
  if (items.length === 0) return undefined
  return items.length === 1 ? items[0] : { kind: 'all', of: items }
}

/**
 * Antirequisites: collect every linked course from "Not completed nor concurrently
 * enrolled in" leaves; anything else is kept as free text for display.
 */
export function parseAntirequisites(html: string | undefined): { codes: CourseCode[]; text: string[] } {
  if (!html?.trim()) return { codes: [], text: [] }
  const root = parse(html.replace(/<!-- -->/g, ''))
  const results = root.querySelectorAll('[data-test$="-result"]')
  const codes = new Set<CourseCode>()
  const text: string[] = []
  for (const r of results) {
    const links = courseLinks(r)
    if (links.length && /^Not completed/i.test(leadText(r))) links.forEach((c) => codes.add(c))
    else text.push(norm(r.text))
  }
  if (results.length === 0) {
    const raw = norm(root.text)
    if (raw) text.push(raw)
  }
  return { codes: [...codes], text }
}

/** Walk the AST and count leaf kinds (used for coverage reporting). */
export function countKinds(r: Requisite | undefined, acc: Record<string, number> = {}) {
  if (!r) return acc
  acc[r.kind] = (acc[r.kind] ?? 0) + 1
  if (r.kind === 'all' || r.kind === 'atLeast') r.of.forEach((c) => countKinds(c, acc))
  return acc
}
