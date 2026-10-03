/** Dinic max-flow on integer capacities. Small and allocation-free per augment. */
export class FlowGraph {
  readonly size: number
  private head: number[]
  private to: number[] = []
  private cap: number[] = []
  private next: number[] = []
  private level: Int32Array
  private iter: Int32Array

  constructor(size: number) {
    this.size = size
    this.head = new Array(size).fill(-1)
    this.level = new Int32Array(size)
    this.iter = new Int32Array(size)
  }

  /** Raise the capacity of a forward edge that has carried no flow yet. */
  setCapacity(id: number, capacity: number) {
    this.cap[id] = capacity - this.cap[id + 1]
  }

  /** Adds edge u→v and returns its id (use with `flowOn`). */
  addEdge(u: number, v: number, capacity: number): number {
    const id = this.to.length
    this.to.push(v, u)
    this.cap.push(capacity, 0)
    this.next.push(this.head[u], this.head[v])
    this.head[u] = id
    this.head[v] = id + 1
    return id
  }

  /** Flow currently pushed through edge `id` (the residual capacity of its reverse edge). */
  flowOn(id: number): number {
    return this.cap[id + 1]
  }

  maxFlow(s: number, t: number): number {
    let total = 0
    while (this.bfs(s, t)) {
      for (let i = 0; i < this.size; i++) this.iter[i] = this.head[i]
      let f: number
      while ((f = this.dfs(s, t, Infinity)) > 0) total += f
    }
    return total
  }

  private bfs(s: number, t: number): boolean {
    this.level.fill(-1)
    const queue = [s]
    this.level[s] = 0
    for (let qi = 0; qi < queue.length; qi++) {
      const u = queue[qi]
      for (let e = this.head[u]; e !== -1; e = this.next[e]) {
        const v = this.to[e]
        if (this.cap[e] > 0 && this.level[v] < 0) {
          this.level[v] = this.level[u] + 1
          queue.push(v)
        }
      }
    }
    return this.level[t] >= 0
  }

  private dfs(u: number, t: number, pushed: number): number {
    if (u === t) return pushed
    for (; this.iter[u] !== -1; this.iter[u] = this.next[this.iter[u]]) {
      const e = this.iter[u]
      const v = this.to[e]
      if (this.cap[e] > 0 && this.level[v] === this.level[u] + 1) {
        const d = this.dfs(v, t, Math.min(pushed, this.cap[e]))
        if (d > 0) {
          this.cap[e] -= d
          this.cap[e + 1] += d
          return d
        }
      }
    }
    return 0
  }
}
