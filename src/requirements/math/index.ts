/** Faculty of Mathematics majors other than Computer Science (BCS), 2026/27 calendar. */
import type { Major } from '@/domain/requirements'
import { major as actsci } from './actsci'
import { major as amath } from './amath'
import { major as amathSc } from './amath-sc'
import { major as biostat } from './biostat'
import { major as cfm } from './cfm'
import { major as co } from './co'
import { major as cm } from './cm'
import { major as csBmath } from './cs-bmath'
import { major as dsBcs } from './ds-bcs'
import { major as dsBmath } from './ds-bmath'
import { major as farmCfa } from './farm-cfa'
import { major as farmPrm } from './farm-prm'
import { major as itm } from './itm'
import { major as mathbus } from './mathbus'
import { major as mathcpa } from './mathcpa'
import { major as mathecon } from './mathecon'
import { major as mathfin } from './mathfin'
import { major as mathphys } from './mathphys'
import { major as mathstudies } from './mathstudies'
import { major as mathteach } from './mathteach'
import { major as moptBus } from './mopt-bus'
import { major as moptOr } from './mopt-or'
import { major as pmath } from './pmath'
import { major as stat } from './stat'

export const MATH_MAJORS: Major[] = [
  actsci,
  amath,
  amathSc,
  biostat,
  cfm,
  co,
  cm,
  csBmath,
  dsBcs,
  dsBmath,
  farmCfa,
  farmPrm,
  itm,
  mathbus,
  mathcpa,
  mathecon,
  mathfin,
  mathphys,
  mathstudies,
  mathteach,
  moptBus,
  moptOr,
  pmath,
  stat,
]
