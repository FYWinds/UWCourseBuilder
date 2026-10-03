export interface PositionedText {
  str: string
  x: number
  y: number
}

/**
 * Rebuild visual lines from positioned PDF text: items whose baselines are within
 * 2pt share a line, ordered left to right, joined with two spaces so table
 * columns stay separated. Lines run top to bottom.
 */
export function textItemsToLines(items: PositionedText[]): string[] {
  const rows: { y: number; items: PositionedText[] }[] = []
  for (const item of items) {
    if (!item.str.trim()) continue
    const row = rows.find((r) => Math.abs(r.y - item.y) <= 2)
    if (row) row.items.push(item)
    else rows.push({ y: item.y, items: [item] })
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map((r) =>
      r.items
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str.trim())
        .join('  '),
    )
}

/**
 * Extract the text of a PDF in the browser (pdf.js loaded on demand, worker off-thread).
 * The legacy build is used because the modern one relies on ES2026 APIs
 * (Map.prototype.getOrInsertComputed) that current browsers do not all ship.
 */
export async function pdfToText(data: ArrayBuffer): Promise<string> {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  const task = pdfjs.getDocument({ data })
  try {
    const doc = await task.promise
    const pages: string[] = []
    for (let p = 1; p <= doc.numPages; p++) {
      const content = await (await doc.getPage(p)).getTextContent()
      const items = content.items.flatMap((it) =>
        'str' in it ? [{ str: it.str, x: it.transform[4] as number, y: it.transform[5] as number }] : [],
      )
      pages.push(textItemsToLines(items).join('\n'))
    }
    return pages.join('\n')
  } finally {
    await task.destroy()
  }
}
