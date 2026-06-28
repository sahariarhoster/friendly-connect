import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FieldList } from "@/components/FieldEditor";
import type { CustomField } from "@/lib/positions";
import { Pencil, ListChecks } from "lucide-react";

export function QuestionsDialog({
  fields,
  onSave,
  title = "Application form questions",
  description = "Add, edit, reorder, or remove the questions applicants will see.",
  triggerLabel = "Customize questions",
}: {
  fields: CustomField[];
  onSave: (next: CustomField[]) => void;
  title?: string;
  description?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CustomField[]>(fields);

  // sync incoming changes when opening
  useEffect(() => {
    if (open) setDraft(fields);
  }, [open, fields]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Pencil className="h-3.5 w-3.5" />
        {triggerLabel}
        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
          {fields.length}
        </Badge>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <ListChecks className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="mt-2">
            <FieldList fields={draft} onChange={setDraft} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { onSave(draft); setOpen(false); }}>
              Save {draft.length} {draft.length === 1 ? "question" : "questions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
