export const RAW_DIR = 'data/raw'
export const OUT_DIR = 'public/data'

/** Kuali catalog backing the 2026/27 Undergraduate Studies Academic Calendar. */
export const KUALI_BASE = 'https://uwaterloocm.kuali.co/api/v1/catalog'
export const KUALI_CATALOG_ID = '67e557ed6ed2fe2bd3a38956'
export const CALENDAR_LABEL = '2026-2027 Undergraduate Studies Academic Calendar'

/** Program pids in the 2026/27 catalog (see docs/PLAN.md §2.1). */
export const PROGRAM_PIDS = {
  'bcs-degree': 'r1y1WO5ka',
  'bcs-major': 'SJPJkCAih',
  'spec-ai': 'H1vJJCCj3',
  'spec-bio': 'r17wJ10As2',
  'spec-bus': 'S1eD1J0Aj2',
  'spec-cfa': 'SkLD1kC0jh',
  'spec-dhw': 'H1Svy1R0jh',
  'spec-gd': 'HkTtesszA',
  'spec-hci': 'rkP1y00ih',
  'spec-se': 'S1v11A0sn',
} as const

export const OPENDATA_BASE = 'https://openapi.data.uwaterloo.ca/v3'

/** Terms used to infer offering patterns: last 3 academic years. */
export const OFFERING_TERMS = [
  '1239', '1241', '1245', '1249', '1251', '1255', '1259', '1261', '1265', '1269', '1271',
]
/** Terms scanned section-by-section for online (ONLN) offerings. */
export const ONLINE_SCAN_TERMS = ['1261', '1265', '1269']
