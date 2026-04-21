import { FormEvent, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectorRow } from "@/hooks/usePortalData";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "email" | "select";
  required?: boolean;
  options?: { label: string; value: string }[];
  maxLength?: number;
};

interface RecordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldConfig[];
  initial?: Record<string, string | null | undefined>;
  sectors?: SectorRow[];
  onSubmit: (values: Record<string, string>) => Promise<void> | void;
}

export function RecordForm({ open, onOpenChange, title, fields, initial, sectors = [], onSubmit }: RecordFormProps) {
  const defaults = useMemo(() => Object.fromEntries(fields.map((f) => [f.name, initial?.[f.name] ?? ""])), [fields, initial]);
  const [values, setValues] = useState<Record<string, string>>(defaults as Record<string, string>);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues(defaults as Record<string, string>), [defaults, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await onSubmit(values);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="font-display text-2xl">{title}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea id={field.name} value={values[field.name] ?? ""} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })} required={field.required} maxLength={field.maxLength} rows={4} className="mt-1" />
              ) : field.type === "select" ? (
                <Select value={values[field.name] ?? ""} onValueChange={(v) => setValues({ ...values, [field.name]: v })} required={field.required}>
                  <SelectTrigger id={field.name} className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {field.name === "sector_id" && sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    {field.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input id={field.name} type={field.type ?? "text"} value={values[field.name] ?? ""} onChange={(e) => setValues({ ...values, [field.name]: e.target.value })} required={field.required} maxLength={field.maxLength} className="mt-1" />
              )}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="hero" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
