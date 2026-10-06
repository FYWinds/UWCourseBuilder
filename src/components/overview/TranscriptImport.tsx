import { FileText, Loader2, ShieldCheck, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SequenceId } from '@/domain/plan'
import { SEQUENCES, TRANSFER_TERM_ID } from '@/domain/plan'
import type { SpecId } from '@/domain/requirements'
import { DEGREE_LABEL } from '@/domain/requirements'
import {
  type TranscriptImportResult,
  type TranscriptSummary,
  activePrograms,
  buildTerms,
  defaultEquivalences,
  detectMajor,
  detectSpecs,
  formatCode,
  inferSequence,
  parseTranscript,
  planFromTranscript,
  termName,
} from '@/engine'
import { useCatalog } from '@/lib/data'
import { pdfToText } from '@/lib/pdfText'
import { cn } from '@/lib/utils'
import { MAJORS, MAJORS_BY_DEGREE } from '@/requirements/majors'
import { SPECS } from '@/requirements/specs'
import { usePlanStore } from '@/store/plan'

interface Parsed {
  summary: TranscriptSummary
  major: string
  sequence: SequenceId
  specs: SpecId[]
  equivalences: string[]
}

/** Quest unofficial transcript (PDF or pasted text) → plan, with a preview before applying. */
export function TranscriptImport() {
  const idx = useCatalog()
  const plan = usePlanStore((s) => s.plan)
  const replacePlan = usePlanStore((s) => s.replacePlan)
  const [open, setOpen] = useState(false)
  const [pasted, setPasted] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<Parsed | null>(null)

  const load = (text: string) => {
    const summary = parseTranscript(text)
    if (summary.terms.length === 0 && summary.transfer.length === 0) {
      setParsed(null)
      setError('No terms found. Use the Unofficial Transcript or Unofficial Grade Report PDF from Quest.')
      return
    }
    const major = MAJORS[detectMajor(summary.program, plan.major) ?? plan.major]
    const fallback = major.sequences.includes(plan.sequence) ? plan.sequence : major.sequences[0]
    const sequence = inferSequence(summary, fallback, major.sequences)
    const specs = [
      ...new Set([...plan.specs.filter((s) => major.specs.includes(s)), ...detectSpecs(summary.program, major.specs)]),
    ]
    setError(null)
    setParsed({
      summary,
      major: major.id,
      sequence,
      specs,
      equivalences: defaultEquivalences(summary, activePrograms({ ...plan, major: major.id, sequence, specs }), idx),
    })
  }

  const loadPdf = async (file: File) => {
    setBusy(true)
    try {
      load(await pdfToText(await file.arrayBuffer()))
    } catch (e) {
      setParsed(null)
      setError(`Could not read the PDF: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const result = useMemo(
    () =>
      parsed &&
      planFromTranscript(plan, parsed.summary, idx, {
        major: parsed.major,
        sequence: parsed.sequence,
        specs: parsed.specs,
        equivalences: parsed.equivalences,
      }),
    [parsed, plan, idx],
  )

  const apply = () => {
    if (!result) return
    replacePlan(result.plan)
    toast.success(`Imported ${result.placed.length} courses from your transcript`)
    setOpen(false)
    setParsed(null)
    setPasted('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setError(null)
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <FileText />
          Import transcript
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90svh] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Import Quest transcript</DialogTitle>
          <DialogDescription>
            Download your <span className="font-medium text-foreground">Unofficial Transcript</span> or{' '}
            <span className="font-medium text-foreground">Unofficial Grade Report</span> PDF from Quest and upload it here —
            or copy all its text and paste it.
          </DialogDescription>
        </DialogHeader>

        {!parsed && (
          <Tabs defaultValue="pdf">
            <TabsList>
              <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
              <TabsTrigger value="paste">Paste text</TabsTrigger>
            </TabsList>
            <TabsContent value="pdf">
              <label
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/40 px-6 py-10 text-center text-sm transition-colors hover:bg-muted',
                  busy && 'pointer-events-none opacity-60',
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) void loadPdf(file)
                }}
              >
                {busy ? <Loader2 className="size-6 animate-spin text-muted-foreground" /> : <Upload className="size-6 text-muted-foreground" />}
                <span className="font-medium">{busy ? 'Reading transcript…' : 'Drop the transcript PDF or click to choose'}</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  aria-label="Transcript PDF"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) void loadPdf(file)
                  }}
                />
              </label>
            </TabsContent>
            <TabsContent value="paste" className="space-y-2">
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder={'Fall 2025\nProgram: Computer Science, Honours, Co-operative Program\nLevel: 1A …\nCS 135 Designing Functional Programs 0.50 0.50 88\n…'}
                className="h-48 w-full resize-y rounded-md border bg-background p-3 font-mono text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Transcript text"
              />
              <Button size="sm" disabled={!pasted.trim()} onClick={() => load(pasted)}>
                Read transcript
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {parsed && result && (
          <Preview
            parsed={parsed}
            onChange={(next) => setParsed({ ...parsed, ...next })}
            result={result}
            startTerm={result.plan.startTerm}
          />
        )}

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Read entirely in your browser. Names, student numbers and grades are not stored.
        </p>

        {parsed && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => setParsed(null)}>
              Back
            </Button>
            <Button onClick={apply}>Replace completed terms with transcript</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Preview({
  parsed,
  onChange,
  result,
  startTerm,
}: {
  parsed: Parsed
  onChange: (next: Partial<Parsed>) => void
  result: TranscriptImportResult
  startTerm: string
}) {
  const terms = buildTerms({ sequence: parsed.sequence, startTerm })
  const statusByCode = new Map(result.placed.map((p) => [p.code, p.status]))
  const major = MAJORS[parsed.major]
  const columns = [
    { id: TRANSFER_TERM_ID, label: 'Transfer', name: 'AP / IB / transfer credit' },
    ...terms.map((t) => ({ id: t.id, label: t.label, name: t.name })),
  ].filter((c) => result.plan.placements[c.id]?.length)

  const changeMajor = (id: string) => {
    const next = MAJORS[id]
    onChange({
      major: id,
      sequence: next.sequences.includes(parsed.sequence) ? parsed.sequence : next.sequences[0],
      specs: parsed.specs.filter((s) => next.specs.includes(s)),
    })
  }

  return (
    <div className="-mr-3 min-h-0 flex-1 overflow-y-auto pr-3">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Major</Label>
            <Select value={parsed.major} onValueChange={changeMajor}>
              <SelectTrigger className="w-full" title={major.name}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAJORS_BY_DEGREE.filter((g) => g.majors.length > 0).map((g) => (
                  <SelectGroup key={g.degree}>
                    <SelectLabel>{DEGREE_LABEL[g.degree]}</SelectLabel>
                    {g.majors.map((m) => (
                      <SelectItem key={m.id} value={m.id} title={m.name}>
                        {m.shortName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <Label className="pt-1 text-xs text-muted-foreground">Study / work sequence</Label>
            <Select value={parsed.sequence} onValueChange={(v) => onChange({ sequence: v as SequenceId })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {major.sequences.map((id) => (
                  <SelectItem key={id} value={id}>
                    {SEQUENCES[id].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 text-sm">
            <div className="text-xs text-muted-foreground">Detected</div>
            <div>1A: {termName(startTerm)}</div>
            <div className="truncate text-muted-foreground" title={parsed.summary.program}>
              {parsed.summary.program ?? 'Program not found'}
            </div>
          </div>
        </div>

        {major.specs.length > 0 && (
          <fieldset className="space-y-1.5">
            <legend className="text-xs text-muted-foreground">Specializations</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {major.specs.map((id) => (
                <label key={id} className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={parsed.specs.includes(id)}
                    onCheckedChange={(c) =>
                      onChange({ specs: c ? [...parsed.specs, id] : parsed.specs.filter((s) => s !== id) })
                    }
                  />
                  {SPECS[id].shortName}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {parsed.summary.equivalences.length > 0 && (
          <fieldset className="space-y-1.5">
            <legend className="text-xs text-muted-foreground">
              Course equivalences noted on the transcript — checked ones are placed as the equivalent course
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {parsed.summary.equivalences.map((e) => (
                <label key={e.from} className="flex items-center gap-1.5 font-mono text-xs">
                  <Checkbox
                    checked={parsed.equivalences.includes(e.from)}
                    onCheckedChange={(c) =>
                      onChange({
                        equivalences: c
                          ? [...parsed.equivalences, e.from]
                          : parsed.equivalences.filter((x) => x !== e.from),
                      })
                    }
                  />
                  {formatCode(e.from)} → {formatCode(e.to)}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            {result.placed.length} courses · completed through{' '}
            {result.plan.completedThrough >= 0 ? terms[result.plan.completedThrough]?.label : 'none'}
          </div>
          {columns.map((c) => (
            <div key={c.id} className="flex gap-3 rounded-lg border bg-card px-3 py-2">
              <div className="w-24 shrink-0">
                <div className="font-serif font-semibold">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.name}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.plan.placements[c.id].map((code) => {
                  const status = statusByCode.get(code)
                  return (
                    <Badge
                      key={code}
                      variant="outline"
                      className={cn(
                        'font-mono',
                        status === 'in-progress'
                          ? 'border-status-planned text-status-planned'
                          : status
                            ? 'border-transparent bg-status-taken text-status-taken-foreground'
                            : 'text-muted-foreground',
                      )}
                      title={status ? (status === 'in-progress' ? 'In progress' : 'Completed') : 'Kept from your plan'}
                    >
                      {formatCode(code)}
                    </Badge>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {result.skipped.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Not imported</div>
            <ul className="space-y-0.5 text-xs">
              {result.skipped.map((s, i) => (
                <li key={`${s.code}-${i}`}>
                  <span className="font-mono">{formatCode(s.code)}</span>
                  {s.termCode && <span className="text-muted-foreground"> ({termName(s.termCode)})</span>} — {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
