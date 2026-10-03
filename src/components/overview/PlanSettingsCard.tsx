import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { BREADTH_RULES, type BreadthRule, SEQUENCES, type SequenceId, resolveBreadthRule } from '@/domain/plan'
import { buildTerms, termName } from '@/engine'
import { SPECS, SPEC_IDS } from '@/requirements/specs'
import { usePlanStore } from '@/store/plan'
import { PlanFileActions } from './PlanFileActions'
import { TranscriptImport } from './TranscriptImport'

/** Fall terms 2023 … 2027 (term codes 1239 … 1279). */
const START_TERMS = [123, 124, 125, 126, 127].map((y) => `${y}9`)
const AUTO = 'auto'

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function PlanSettingsCard() {
  const plan = usePlanStore((s) => s.plan)
  const setSequence = usePlanStore((s) => s.setSequence)
  const setStartTerm = usePlanStore((s) => s.setStartTerm)
  const setCompletedThrough = usePlanStore((s) => s.setCompletedThrough)
  const setWtLimit = usePlanStore((s) => s.setWtLimit)
  const toggleSpec = usePlanStore((s) => s.toggleSpec)
  const setBreadthRule = usePlanStore((s) => s.setBreadthRule)
  const rule = resolveBreadthRule(plan)
  const terms = buildTerms(plan)
  const coop = SEQUENCES[plan.sequence].coop
  const completed = Math.min(plan.completedThrough, terms.length - 1)

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="font-serif text-lg">Plan settings</CardTitle>
        <CardDescription>Saved in this browser.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field id="sequence" label="Study / work sequence">
          <Select value={plan.sequence} onValueChange={(v) => setSequence(v as SequenceId)}>
            <SelectTrigger id="sequence" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SEQUENCES) as SequenceId[]).map((id) => (
                <SelectItem key={id} value={id}>
                  {SEQUENCES[id].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="font-mono text-[0.7rem] leading-relaxed text-muted-foreground">
            {SEQUENCES[plan.sequence].pattern.join(' · ')}
          </p>
        </Field>

        <Field id="start-term" label="1A term">
          <Select value={plan.startTerm} onValueChange={setStartTerm}>
            <SelectTrigger id="start-term" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(START_TERMS.includes(plan.startTerm) ? START_TERMS : [plan.startTerm, ...START_TERMS]).map((code) => (
                <SelectItem key={code} value={code}>
                  {termName(code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="breadth-rule" label="Non-math elective rule">
          <Select
            value={plan.breadthRule ?? AUTO}
            onValueChange={(v) => setBreadthRule(v === AUTO ? undefined : (v as BreadthRule))}
          >
            <SelectTrigger id="breadth-rule" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AUTO}>Auto from 1A term — {BREADTH_RULES[rule].label}</SelectItem>
              {(Object.keys(BREADTH_RULES) as BreadthRule[]).map((id) => (
                <SelectItem key={id} value={id}>
                  {BREADTH_RULES[id].label} ({BREADTH_RULES[id].calendars})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Your calendar is the one in effect when you entered Math; a later one needs a Plan Modification Form.
          </p>
        </Field>

        <Field id="completed-through" label="Completed through">
          <Select value={String(completed)} onValueChange={(v) => setCompletedThrough(Number(v))}>
            <SelectTrigger id="completed-through" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-1">Nothing yet (transfer credit only)</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.id} value={String(t.index)}>
                  <span className="inline-block w-10 font-medium">{t.label}</span>
                  <span className="text-muted-foreground">{t.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Courses in later terms count as planned.</p>
        </Field>

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <Label htmlFor="wt-limit">Two courses per work term</Label>
            <p className="text-xs text-muted-foreground">
              Math co-op regulations: 1 course per work term, 2 with written employer support
            </p>
          </div>
          <Switch
            id="wt-limit"
            checked={plan.wtLimit === 2}
            disabled={!coop}
            onCheckedChange={(on) => setWtLimit(on ? 2 : 1)}
          />
        </div>

        <Separator />

        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-medium text-muted-foreground">Specializations</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {SPEC_IDS.map((id) => (
              <Label key={id} title={SPECS[id].name} className="cursor-pointer items-start text-sm font-normal leading-snug">
                <Checkbox checked={plan.specs.includes(id)} onCheckedChange={() => toggleSpec(id)} className="mt-0.5" />
                {SPECS[id].shortName}
              </Label>
            ))}
          </div>
        </fieldset>

        <Separator />

        <div className="space-y-2">
          <TranscriptImport />
          <PlanFileActions />
        </div>
      </CardContent>
    </Card>
  )
}
