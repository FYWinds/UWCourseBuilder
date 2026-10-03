/** 2.5 → "2.5", 0.25 → "0.25"; drops float noise from summed unit values. */
export const formatUnits = (units: number) => String(Number(units.toFixed(2)))
