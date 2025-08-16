import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { db } from "@/firebaseConfig";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

type ParsedRow = {
  studentId: string;
  courseId: string;
  subject: string;
  date: string;
  present: boolean;
};

export default function ImportAttendanceCSV() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const template = useMemo(
    () => `studentId,courseId,subject,date,present\n` +
      `st_demo_1,c_demo_1,Matemática,2024-09-10,true`,
    []
  );

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

  const parseCSV = (csv: string): ParsedRow[] => {
    const lines = csv.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const required = ["studentid", "courseid", "subject", "date", "present"];
    if (!required.every((k) => header.includes(k))) return [];
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));
    const out: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length < header.length) continue;
      const studentId = cols[idx["studentid"]]?.trim();
      const courseId = cols[idx["courseid"]]?.trim();
      const subject = cols[idx["subject"]]?.trim();
      const date = cols[idx["date"]]?.trim();
      const presentStr = cols[idx["present"]]?.trim().toLowerCase();
      const present = presentStr === "true" || presentStr === "1" || presentStr === "si" || presentStr === "sí";
      if (!studentId || !courseId || !subject || !date) continue;
      // Validar fecha yyyy-MM-dd
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      out.push({ studentId, courseId, subject, date, present });
    }
    return out;
  };

  const save = async () => {
    if (rows.length === 0) {
      toast.error("No hay filas para guardar");
      return;
    }
    setIsSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const r of rows) {
        const docId = `${r.studentId}_${r.courseId}_${r.subject}_${r.date}`;
        const ref = doc(db, "attendances", docId);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          promises.push(updateDoc(ref, { present: r.present, updatedAt: new Date() }));
        } else {
          promises.push(setDoc(ref, {
            studentId: r.studentId,
            courseId: r.courseId,
            subject: r.subject,
            date: r.date,
            present: r.present,
            createdAt: new Date()
          }));
        }
      }
      await Promise.all(promises);
      toast.success("Asistencias importadas", { description: `${rows.length} filas procesadas` });
      setRows([]);
      setFile(null);
    } catch (e) {
      toast.error("Error al guardar asistencias");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asistencias_plantilla.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Importar asistencias (CSV)</h3>
          <p className="text-sm text-gray-600">Formato requerido: studentId, courseId, subject, date (yyyy-MM-dd), present</p>
        </div>
        <div className="space-y-2">
          <Label>Archivo CSV</Label>
          <Input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])} />
        </div>
        <div className="space-y-2">
          <Label>Plantilla</Label>
          <textarea className="w-full border rounded-md p-2 text-xs bg-gray-50" rows={3} readOnly value={template} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={downloadTemplate}>Descargar plantilla</Button>
            {rows.length > 0 && (
              <Button type="button" variant="outline" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? 'Ocultar previsualización' : 'Ver previsualización'}
              </Button>
            )}
          </div>
        </div>
        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-gray-700">{rows.length} filas preparadas para importar</div>
            {showPreview && (
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-5 gap-0 bg-gray-50 text-xs font-medium text-gray-600 px-2 py-1">
                  <div>studentId</div>
                  <div>courseId</div>
                  <div>subject</div>
                  <div>date</div>
                  <div>present</div>
                </div>
                <div className="max-h-48 overflow-auto">
                  {rows.slice(0, 20).map((r, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-0 text-xs px-2 py-1 border-t">
                      <div className="truncate" title={r.studentId}>{r.studentId}</div>
                      <div className="truncate" title={r.courseId}>{r.courseId}</div>
                      <div className="truncate" title={r.subject}>{r.subject}</div>
                      <div>{r.date}</div>
                      <div>{String(r.present)}</div>
                    </div>
                  ))}
                  {rows.length > 20 && (
                    <div className="text-[11px] text-gray-500 px-2 py-1">… y {rows.length - 20} más</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={save} disabled={isParsing || isSaving || rows.length === 0}>
            {isSaving ? 'Guardando...' : 'Importar asistencias'}
          </Button>
          {file && (
            <Button variant="outline" onClick={() => { setFile(null); setRows([]); }}>
              Limpiar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


