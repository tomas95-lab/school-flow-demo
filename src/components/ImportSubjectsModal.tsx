import { useState } from "react";
import ReutilizableDialog from "./DialogReutlizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/firebaseConfig";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import { toast } from "sonner";

type Row = {
  nombre: string;
  cursoId: string;
  teacherId: string;
};

export default function ImportSubjectsModal({ showTrigger = false }: { showTrigger?: boolean }) {
  const [open, setOpen] = useState(false);
  const [_, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const template = `nombre,cursoId,teacherId\nMatemática,c_demo_1,t_demo_1`;

  const handleFile = async (f: File) => {
    setFile(f);
    setIsParsing(true);
    try {
      const text = await f.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("CSV vacío o con encabezados inválidos");
        setRows([]);
      } else {
        setRows(parsed);
        toast.success("CSV procesado", { description: `${parsed.length} filas listas` });
      }
    } catch (e) {
      toast.error("No se pudo leer el archivo");
      setRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const parseCSV = (csv: string): Row[] => {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const required = ["nombre", "cursoid", "teacherid"];
    if (!required.every((k) => header.includes(k))) return [];
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));
    const out: Row[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length < header.length) continue;
      const nombre = (cols[idx["nombre"]] || "").trim();
      const cursoId = (cols[idx["cursoid"]] || "").trim();
      const teacherId = (cols[idx["teacherid"]] || "").trim();
      if (!nombre || !cursoId || !teacherId) continue;
      out.push({ nombre, cursoId, teacherId });
    }
    return out;
  };

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'materias_plantilla.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const save = async () => {
    if (rows.length === 0) {
      toast.error("No hay filas para guardar");
      return;
    }
    setIsSaving(true);
    try {
      // Dedupe simple por (nombre, cursoId, teacherId) contra existentes
      const existing: Set<string> = new Set();
      const qs = query(collection(db, 'subjects'));
      const snap = await getDocs(qs as any);
      snap.forEach((d: any) => {
        const n = (d.data()?.nombre || '').toString().trim().toLowerCase();
        const c = (d.data()?.cursoId || '').toString().trim();
        const t = (d.data()?.teacherId || '').toString().trim();
        existing.add(`${n}|${c}|${t}`);
      });

      let created = 0;
      for (const r of rows) {
        const key = `${r.nombre.trim().toLowerCase()}|${r.cursoId}|${r.teacherId}`;
        if (existing.has(key)) continue;
        await addDoc(collection(db, 'subjects'), {
          nombre: r.nombre,
          cursoId: r.cursoId,
          teacherId: r.teacherId,
          createdAt: new Date(),
        });
        created++;
      }
      toast.success("Materias importadas", { description: `${created} nuevas materias creadas` });
      setRows([]);
      setFile(null);
      setOpen(false);
    } catch (e) {
      toast.error("Error al importar materias");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ReutilizableDialog
      triger={showTrigger ? (
        <span className="flex items-center gap-2">Importar Materias</span>
      ) : undefined}
      title="Importar materias (CSV)"
      description="Carga materias con columnas: nombre, cursoId, teacherId."
      content={(
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Archivo CSV</Label>
            <Input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} />
          </div>
          <div className="space-y-2">
            <Label>Plantilla</Label>
            <textarea className="w-full border rounded-md p-2 text-xs bg-gray-50" rows={3} readOnly value={template} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={downloadTemplate}>Descargar plantilla</Button>
              {rows.length > 0 && <span className="text-xs text-gray-600">{rows.length} filas listas</span>}
            </div>
          </div>
        </div>
      )}
      footer={(
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={isParsing || isSaving || rows.length === 0}>{isSaving ? 'Guardando...' : 'Importar'}</Button>
        </div>
      )}
      open={open}
      onOpenChange={setOpen}
      small={true}
    />
  );
}


