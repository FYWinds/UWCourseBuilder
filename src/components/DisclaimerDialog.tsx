import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/** Shown once per page load: the tool is unofficial and may be wrong. */
export function DisclaimerDialog() {
  const [open, setOpen] = useState(true)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Before you start</DialogTitle>
          <DialogDescription>
            UW Course Builder is an unofficial planning aid and is not affiliated with the University of Waterloo.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Requirements are hand-encoded from the Undergraduate Calendar and may contain mistakes.</li>
          <li>Course offerings are past schedules, not a promise for upcoming terms — check Quest.</li>
          <li>Confirm your plan with the official calendar and a CS academic advisor before enrolling.</li>
          <li>Your plan and imported transcripts stay in this browser; nothing is uploaded.</li>
        </ul>
        <DialogFooter>
          <DialogClose asChild>
            <Button>I understand</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
