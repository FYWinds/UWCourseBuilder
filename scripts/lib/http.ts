import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit = {},
  retries = 8,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { Accept: 'application/json', ...init.headers },
      })
      if (res.status === 404) throw new NotFoundError(url)
      if (res.status === 429) {
        // Open Data rate-limits without headers; back off hard before retrying.
        lastError = new Error(`429 for ${url}`)
        await sleep(Math.min(120_000, 15_000 * 2 ** attempt))
        continue
      }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
      return (await res.json()) as T
    } catch (err) {
      if (err instanceof NotFoundError) throw err
      lastError = err
      await sleep(500 * 2 ** Math.min(attempt, 5))
    }
  }
  throw lastError
}

export class NotFoundError extends Error {
  constructor(url: string) {
    super(`404 for ${url}`)
  }
}

/** Fetch JSON through an on-disk cache; `refresh` bypasses the cache. */
export async function cachedJson<T>(
  cachePath: string,
  load: () => Promise<T>,
  refresh = false,
): Promise<T> {
  if (!refresh && existsSync(cachePath)) {
    return JSON.parse(await readFile(cachePath, 'utf8')) as T
  }
  const data = await load()
  await mkdir(dirname(cachePath), { recursive: true })
  await writeFile(cachePath, JSON.stringify(data))
  return data
}

/** Run `fn` over `items` with bounded concurrency, preserving order. */
export async function pool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  let done = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
      done++
      onProgress?.(done, items.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

export function progress(label: string) {
  let last = 0
  return (done: number, total: number) => {
    const now = Date.now()
    if (done === total || now - last > 2000) {
      last = now
      console.log(`  ${label}: ${done}/${total}`)
    }
  }
}
