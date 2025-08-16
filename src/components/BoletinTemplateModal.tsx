import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBoletinTemplate, saveBoletinTemplate, type BoletinTemplate } from '@/services/boletinService';

export default function BoletinTemplateModal() {
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<BoletinTemplate | null>(null);
  const [customOrder, setCustomOrder] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      getBoletinTemplate().then(t => {
        setTemplate(t);
        setCustomOrder((t.customOrder || []).join(', '));
      });
    }
  }, [open]);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    try {
      const parsedOrder = customOrder
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      await saveBoletinTemplate({ ...template, customOrder: parsedOrder });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Configurar plantilla de boletín</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Plantilla de Boletín</DialogTitle>
        </DialogHeader>
        {template && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Color primario</Label>
                <Input type="color" value={template.primaryColorHex} onChange={(e) => setTemplate({ ...template, primaryColorHex: e.target.value })} />
              </div>
              <div>
                <Label>Color secundario</Label>
                <Input type="color" value={template.secondaryColorHex} onChange={(e) => setTemplate({ ...template, secondaryColorHex: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Logo (URL)</Label>
                <Input placeholder="https://.../logo.png" value={template.logoUrl || ''} onChange={(e) => setTemplate({ ...template, logoUrl: e.target.value })} />
              </div>
              <div>
                <Label>Tamaño de papel</Label>
                <Select value={template.paperSize} onValueChange={(v) => setTemplate({ ...template, paperSize: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Carta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Orden de materias</Label>
                <Select value={template.orderStrategy} onValueChange={(v) => setTemplate({ ...template, orderStrategy: v as any })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Orden" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Por nombre</SelectItem>
                    <SelectItem value="gradeDesc">Promedio (Mayor a menor)</SelectItem>
                    <SelectItem value="gradeAsc">Promedio (Menor a mayor)</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {template.orderStrategy === 'custom' && (
                <div className="md:col-span-2">
                  <Label>Orden personalizado (separado por coma)</Label>
                  <Input placeholder="Matemática, Lengua, Historia" value={customOrder} onChange={(e) => setCustomOrder(e.target.value)} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={template.showAttendance} onChange={(e) => setTemplate({ ...template, showAttendance: e.target.checked })} />
                Mostrar asistencia
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={template.showComments} onChange={(e) => setTemplate({ ...template, showComments: e.target.checked })} />
                Mostrar comentarios
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


