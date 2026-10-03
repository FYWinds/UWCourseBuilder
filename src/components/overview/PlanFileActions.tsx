import { Download, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { parsePlanJson, usePlanStore } from '@/store/plan'

const FILE_NAME = 'uw-course-builder-plan.json'

function exportPlan() {
  const blob = new Blob([JSON.stringify(usePlanStore.getState().plan, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = FILE_NAME
  a.click()
  URL.revokeObjectURL(url)
}

export function PlanFileActions() {
  const replacePlan = usePlanStore((s) => s.replacePlan)
  const reset = usePlanStore((s) => s.reset)
  const fileInput = useRef<HTMLInputElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const importFile = async (file: File) => {
    try {
      replacePlan(parsePlanJson(await file.text()))
      toast.success(`Imported ${file.name}`)
    } catch (e) {
      toast.error('Could not import plan', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={exportPlan}>
        <Download />
        Export
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
        <Upload />
        Import
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Import plan JSON"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void importFile(file)
        }}
      />
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <RotateCcw />
            Reset
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset the plan?</DialogTitle>
            <DialogDescription>
              This removes every placed course and specialization and restores the default sequence. Export first if
              you want to keep a copy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                reset()
                setConfirmOpen(false)
                toast('Plan reset')
              }}
            >
              Reset plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
