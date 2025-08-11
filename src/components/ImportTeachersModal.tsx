import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  
  Plus,
  Shield
} from "lucide-react";
import ReutilizableDialog from "@/components/DialogReutlizable";
import { db, auth } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { deleteApp, initializeApp } from "firebase/app";

type ImportTeachersModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

type CSVTeacher = {
  nombre: string;
  apellido: string;
  email: string;
  status?: string;
  password?: string;
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let pwd = "";
  for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

export default function ImportTeachersModal({ open: externalOpen, onOpenChange: externalOnOpenChange, showTrigger = true }: ImportTeachersModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [csvData, setCsvData] = useState<CSVTeacher[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (externalOnOpenChange) externalOnOpenChange(newOpen);
    else setInternalOpen(newOpen);
  };

  const validateRow = async (row: CSVTeacher): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!row.nombre?.trim()) errors.push("Nombre es requerido");
    if (!row.apellido?.trim()) errors.push("Apellido es requerido");
    if (!row.email?.trim()) errors.push("Email es requerido");
    if (row.email && !/\S+@\S+\.\S+/.test(row.email)) errors.push("Email inválido");

    if (row.status && !["active", "inactive", "activo", "inactivo"].includes(row.status.toLowerCase())) {
      warnings.push('Status debería ser "active" o "inactive"');
    }

    // Verificar duplicidad por email en users
    if (row.email) {
      const q = query(collection(db, "users"), where("email", "==", row.email));
      const snap = await getDocs(q);
      if (!snap.empty) errors.push("Email ya registrado en usuarios");
    }

    return { isValid: errors.length === 0, errors, warnings };
  };

  const parseCSV = (csvText: string): CSVTeacher[] => {
    const lines = csvText.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) return [];
    const firstLine = lines[0];
    const delimiter = firstLine.includes(",") ? "," : ";";
    const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase());
    const required = ["nombre", "apellido", "email"];
    const missing = required.filter((h) => !headers.includes(h));
    if (missing.length > 0) throw new Error(`Headers faltantes: ${missing.join(", ")}`);

    const rows: CSVTeacher[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim());
      rows.push({
        nombre: values[headers.indexOf("nombre")] || "",
        apellido: values[headers.indexOf("apellido")] || "",
        email: values[headers.indexOf("email")] || "",
        status: headers.includes("status") ? values[headers.indexOf("status")] : undefined,
        password: headers.includes("password") ? values[headers.indexOf("password")] : undefined,
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
          // Validación asincrónica por duplicados
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

  const validCount = useMemo(() => validationResults.filter((r) => r.isValid).length, [validationResults]);
  const invalidCount = useMemo(() => validationResults.filter((r) => !r.isValid).length, [validationResults]);

  const downloadTemplate = () => {
    const template = `nombre,apellido,email,status,password\nJuan,Pérez,juan.perez@escuela.edu,active,Clave123!\nMaría,González,maria.gonzalez@escuela.edu,active,Clave123!`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_docentes.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setCsvData([]);
    setValidationResults([]);
    setImportResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const importTeachers = async () => {
    if (csvData.length === 0) return;
    setIsProcessing(true);
    let success = 0;
    let errors = 0;

    // Instancia secundaria para no afectar la sesión actual
    const secondaryApp = initializeApp(auth.app.options, `secondary-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const result = validationResults[i];
        if (!result?.isValid) { errors++; continue; }

        try {
          const pwd = row.password && row.password.length >= 6 ? row.password : generatePassword(10);
          const cred = await createUserWithEmailAndPassword(secondaryAuth, row.email, pwd);
          const uid = cred.user.uid;

          // users
          await setDoc(doc(db, "users", uid), {
            id: uid,
            name: `${row.nombre} ${row.apellido}`.trim(),
            email: row.email,
            role: "docente",
            status: (row.status || "active").toLowerCase() === "inactivo" ? "inactive" : (row.status || "active").toLowerCase(),
            createdAt: new Date().toISOString(),
            lastLogin: null,
            teacherId: uid,
            studentId: ""
          });

          // teachers
          await setDoc(doc(db, "teachers", uid), {
            nombre: row.nombre.trim(),
            apellido: row.apellido.trim(),
            email: row.email.trim(),
            status: (row.status || "active").toLowerCase() === "inactivo" ? "inactive" : (row.status || "active").toLowerCase(),
            createdAt: serverTimestamp()
          });

          success++;
        } catch (err) {
          console.error(`Error importando docente ${i + 1}:`, err);
          errors++;
        }
      }

      setImportResults({ success, errors, total: csvData.length });
      if (success > 0) {
        toast.success("Importación de docentes completada", { description: `${success} docentes importados${errors ? `, ${errors} errores` : ""}` });
      } else if (errors) {
        toast.error("No se pudo importar ningún docente");
      }
    } finally {
      await Promise.all([
        signOut(secondaryAuth).catch(() => {}),
        deleteApp(secondaryApp).catch(() => {})
      ]);
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
            <p>El CSV debe tener columnas: <strong>nombre, apellido, email</strong>. Opcionales: <strong>status, password</strong>.</p>
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
              <Shield className="h-5 w-5" />
              Vista Previa ({csvData.length} docentes)
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
                    <th className="text-left p-2">Apellido</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((t, idx) => {
                    const v = validationResults[idx];
                    return (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2">{t.nombre}</td>
                        <td className="p-2">{t.apellido}</td>
                        <td className="p-2">{t.email}</td>
                        <td className="p-2">{t.status || "active"}</td>
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
      <Button onClick={importTeachers} disabled={isProcessing || validCount === 0} className="bg-green-600 hover:bg-green-700">
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Importando...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Importar {validCount} Docentes
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
          Importar Docentes
        </span>
      ) : undefined}
      background
      title="Importar Docentes desde CSV"
      description="Sube un CSV para crear docentes (usuarios y perfiles) de forma masiva"
      content={content}
      footer={footer}
      open={isOpen}
      onOpenChange={handleOpenChange}
      small={false}
    />
  );
}


