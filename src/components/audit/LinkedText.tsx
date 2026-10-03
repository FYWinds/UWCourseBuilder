import { Fragment } from 'react'
import { CourseLink } from '@/components/course/CourseLink'
import type { CatalogIndex } from '@/engine'
import { formatCode } from '@/engine'

const CODE_SPLIT = /\b([A-Z]{2,8}\d{1,3}[A-Z]?)\b/

/** Renders free text with every catalog course code ("CS486") turned into a CourseLink. */
export function LinkedText({ text, idx }: { text: string; idx: CatalogIndex }) {
  const parts = text.split(CODE_SPLIT)
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>
        return idx.byCode.has(part) ? <CourseLink key={i} code={part} /> : <Fragment key={i}>{formatCode(part)}</Fragment>
      })}
    </>
  )
}
