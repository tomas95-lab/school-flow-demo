import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download, Building2 } from "lucide-react";
import ReutilizableDialog from "@/components/DialogReutlizable";
import { db } from "@/firebaseConfig";
import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";

type ImportCoursesModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

type CSVCourse = {
  nombre: string;
  division: string;
  año?: string | number;
  nivel?: string;
  teacherId?: string;
  teacherEmail?: string;
  modalidad?: string;
  turno?: string;
  maxStudents?: string | number;
  description?: string;
  aula?: string;
  status?: string;
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  resolvedTeacherId?: string;
};

const validLevels = ["inicial", "primaria", "secundaria", "bachillerato", "tecnico"];
const validStatuses = ["active", "inactive", "activo", "inactivo"];

export default function ImportCoursesModal({ open: externalOpen, onOpenChange: externalOnOpenChange, showTrigger = true }: ImportCoursesModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [csvData, setCsvData] = useState<CSVCourse[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (externalOnOpenChange) externalOnOpenChange(newOpen);
    else setInternalOpen(newOpen);
  };

  const normalizeStatus = (v?: string) => {
    if (!v) return "active";
    const low = v.toLowerCase();
    if (low === "inactivo") return "inactive";
    return validStatuses.includes(low) ? low : "active";
  };

  const parseCSV = (csvText: string): CSVCourse[] => {
    const lines = csvText.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) return [];
    const first = lines[0];
    const delimiter = first.includes(",") ? "," : ";";
    const headers = first.split(delimiter).map((h) => h.trim().toLowerCase());
    const required = ["nombre", "division"];
    const missing = required.filter((h) => !headers.includes(h));
    if (missing.length > 0) throw new Error(`Headers faltantes: ${missing.join(", ")}`);

    const rows: CSVCourse[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim());
      rows.push({
        nombre: values[headers.indexOf("nombre")] || "",
        division: values[headers.indexOf("division")] || "",
        año: headers.includes("año") ? values[headers.indexOf("año")] : headers.includes("anio") ? values[headers.indexOf("anio")] : undefined,
        nivel: headers.includes("nivel") ? values[headers.indexOf("nivel")] : undefined,
        teacherId: headers.includes("teacherid") ? values[headers.indexOf("teacherid")] : undefined,
        teacherEmail: headers.includes("teacheremail") ? values[headers.indexOf("teacheremail")] : undefined,
        modalidad: headers.includes("modalidad") ? values[headers.indexOf("modalidad")] : undefined,
        turno: headers.includes("turno") ? values[headers.indexOf("turno")] : undefined,
        maxStudents: headers.includes("maxstudents") ? values[headers.indexOf("maxstudents")] : undefined,
        description: headers.includes("description") ? values[headers.indexOf("description")] : undefined,
        aula: headers.includes("aula") ? values[headers.indexOf("aula")] : undefined,
        status: headers.includes("status") ? values[headers.indexOf("status")] : undefined,
      });
    }
    return rows;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = (ev.target?.result as string) || "";
        const rows = parseCSV(text);
        setCsvData(rows);
        const results: ValidationResult[] = [];
        for (const row of rows) {
          // eslint-disable-next-line no-await-in-loop
          results.push(await validateRow(row));
        }
        setValidationResults(results);
      } catch (err) {
        toast.error("Error al procesar el CSV");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const validateRow = async (row: CSVCourse): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!row.nombre?.trim()) errors.push("nombre es requerido");
    if (!row.division?.trim()) errors.push("division es requerido");

    if (row.nivel && !validLevels.includes(row.nivel.toLowerCase())) warnings.push("nivel no estándar");
    if (row.status && !validStatuses.includes(row.status.toLowerCase())) warnings.push("status debería ser active/inactive");

    // Resolver teacherId por email si no viene teacherId
    let resolvedTeacherId: string | undefined = row.teacherId?.trim() || undefined;
    if (!resolvedTeacherId && row.teacherEmail) {
      const q = query(collection(db, "users"), where("email", "==", row.teacherEmail.trim()), where("role", "==", "docente"));
      const snap = await getDocs(q);
      if (!snap.empty) resolvedTeacherId = snap.docs[0].id;
      else warnings.push("teacherEmail no encontrado");
    }

    // Si hay teacherId, validar que exista en teachers o users
    if (resolvedTeacherId) {
      const tSnap = await getDocs(query(collection(db, "teachers"), where("__name__", "==", resolvedTeacherId)));
      if (tSnap.empty) {
        const uSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", resolvedTeacherId), where("role", "==", "docente")));
        if (uSnap.empty) warnings.push("teacherId no corresponde a un docente existente");
      }
    }

    return { isValid: errors.length === 0, errors, warnings, resolvedTeacherId };
  };

  const validCount = useMemo(() => validationResults.filter((v) => v.isValid).length, [validationResults]);
  const invalidCount = useMemo(() => validationResults.filter((v) => !v.isValid).length, [validationResults]);

  const downloadTemplate = () => {
    const template = `nombre,division,año,nivel,teacherId,teacherEmail,modalidad,turno,maxStudents,description,aula,status\n1er Año, A, 2025, secundaria, , docente1@escuela.edu, presencial, mañana, 30, Curso base, A1, active`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_cursos.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setCsvData([]);
    setValidationResults([]);
    setImportResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importCourses = async () => {
    if (csvData.length === 0) return;
    setIsProcessing(true);
    let success = 0;
    let errors = 0;

    try {
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const val = validationResults[i];
        if (!val?.isValid) { errors++; continue; }

        try {
          const payload: Record<string, any> = {
            nombre: row.nombre.trim(),
            division: row.division.trim(),
            año: row.año ? Number(row.año) : new Date().getFullYear(),
            nivel: row.nivel?.toLowerCase() || "",
            teacherId: val.resolvedTeacherId || row.teacherId || "",
            modalidad: row.modalidad || "presencial",
            turno: row.turno || "mañana",
            maxStudents: row.maxStudents ? Number(row.maxStudents) : 30,
            description: row.description || "",
            aula: row.aula || "",
            status: normalizeStatus(row.status),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await addDoc(collection(db, "courses"), payload);
          success++;
        } catch (err) {
          console.error(`Error importando curso ${i + 1}:`, err);
          errors++;
        }
      }

      setImportResults({ success, errors, total: csvData.length });
      if (success > 0) {
        toast.success("Importación de cursos completada", { description: `${success} cursos importados${errors ? `, ${errors} errores` : ""}` });
      } else if (errors) {
        toast.error("No se pudo importar ningún curso");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instrucciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              El CSV debe incluir columnas requeridas: <strong>nombre</strong>, <strong>division</strong>. Opcionales: <strong>año</strong>, <strong>nivel</strong>, <strong>teacherId</strong> o <strong>teacherEmail</strong>, <strong>modalidad</strong>, <strong>turno</strong>, <strong>maxStudents</strong>, <strong>description</strong>, <strong>aula</strong>, <strong>status</strong>.
            </p>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Archivo CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </CardContent>
      </Card>

      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Vista Previa ({csvData.length} cursos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />{validCount} válidos</Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{invalidCount} con errores</Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Nombre</th>
                    <th className="text-left p-2">División</th>
                    <th className="text-left p-2">Año</th>
                    <th className="text-left p-2">Nivel</th>
                    <th className="text-left p-2">Teacher</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((c, idx) => {
                    const v = validationResults[idx];
                    return (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2">{c.nombre}</td>
                        <td className="p-2">{c.division}</td>
                        <td className="p-2">{c.año || new Date().getFullYear()}</td>
                        <td className="p-2">{c.nivel || '-'}</td>
                        <td className="p-2">{c.teacherId || c.teacherEmail || '-'}</td>
                        <td className="p-2">{normalizeStatus(c.status)}</td>
                        <td className="p-2">
                          {v?.isValid ? (
                            <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Válido</Badge>
                          ) : (
                            <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {invalidCount > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {validationResults.map((res, idx) => (
                    !res.isValid ? (
                      <div key={idx} className="text-sm">
                        <strong>Línea {idx + 2}:</strong>
                        <ul className="ml-4 mt-1">
                          {res.errors.map((e, i) => (<li key={i} className="text-red-600">• {e}</li>))}
                          {res.warnings.map((w, i) => (<li key={i} className="text-yellow-600">• {w}</li>))}
                        </ul>
                      </div>
                    ) : null
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Importación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Total procesados:</strong> {importResults.total}</p>
              <p className="text-green-600"><strong>Importados exitosamente:</strong> {importResults.success}</p>
              {importResults.errors > 0 && (
                <p className="text-red-600"><strong>Errores:</strong> {importResults.errors}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={reset}>
        Limpiar
      </Button>
      <Button onClick={importCourses} disabled={isProcessing || validCount === 0} className="bg-green-600 hover:bg-green-700">
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Importando...
          </>
        ) : (
          <>
            Importar {validCount} Cursos
          </>
        )}
      </Button>
    </div>
  );

  return (
    <ReutilizableDialog
      triger={showTrigger && externalOpen === undefined ? (
        <span className="flex items-center gap-2">
          <Upload />
          Importar Cursos
        </span>
      ) : undefined}
      background
      title="Importar Cursos desde CSV"
      description="Sube un CSV para crear cursos de forma masiva"
      content={content}
      footer={footer}
      open={isOpen}
      onOpenChange={handleOpenChange}
      small={false}
    />
  );
}


