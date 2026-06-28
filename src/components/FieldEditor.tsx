import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { CustomField, CustomFieldType } from "@/lib/positions";

export function FieldList({
  fields,
  onChange,
}: {
  fields: CustomField[];
  onChange: (next: CustomField[]) => void;
}) {
  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">No questions yet. Add one below.</p>
      )}
      {fields.map((f, i) => (
        <FieldEditor
          key={i}
          field={f}
          onChange={(next) => onChange(fields.map((x, idx) => (idx === i ? next : x)))}
          onRemove={() => onChange(fields.filter((_, idx) => idx !== i))}
          onMove={(dir) => {
            const j = i + dir;
            if (j < 0 || j >= fields.length) return;
            const next = [...fields];
            [next[i], next[j]] = [next[j], next[i]];
            onChange(next);
          }}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...fields,
            { key: `q_${fields.length + 1}_${Math.random().toString(36).slice(2, 6)}`, label: "", type: "text", required: false },
          ])
        }
      >
        <Plus className="mr-1 h-4 w-4" /> Add question
      </Button>
    </div>
  );
}

function FieldEditor({
  field, onChange, onRemove, onMove,
}: {
  field: CustomField;
  onChange: (f: CustomField) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Question label (e.g. Years of experience)"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          className="flex-1"
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => onMove(-1)} title="Move up">↑</Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => onMove(1)} title="Move down">↓</Button>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} title="Remove">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={field.type} onValueChange={(v) => onChange({ ...field, type: v as CustomFieldType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Short text</SelectItem>
              <SelectItem value="textarea">Long text</SelectItem>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="select">Dropdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input value={field.placeholder ?? ""} onChange={(e) => onChange({ ...field, placeholder: e.target.value })} />
        </div>
        <div className="flex items-end gap-2">
          <Switch checked={!!field.required} onCheckedChange={(v) => onChange({ ...field, required: v })} />
          <Label className="text-xs">Required</Label>
        </div>
      </div>
      {field.type === "select" && (
        <div>
          <Label className="text-xs">Options (one per line)</Label>
          <Textarea
            rows={3}
            value={(field.options ?? []).join("\n")}
            onChange={(e) => onChange({ ...field, options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
          />
        </div>
      )}
    </div>
  );
}
