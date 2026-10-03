/** 20 → "20.0", 1.5 → "1.5", 0.25 → "0.25". */
export function formatUnits(units: number): string {
  const rounded = Math.round(units * 100) / 100
  return Number.isInteger(rounded * 2) ? rounded.toFixed(1) : rounded.toFixed(2)
}
