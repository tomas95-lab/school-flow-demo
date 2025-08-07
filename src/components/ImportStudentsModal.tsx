import { useState, useRef } from "react";
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
  Users,
  Plus
} from "lucide-react";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { db } from "@/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import ReutilizableDialog from "@/components/DialogReutlizable";

interface CSVStudent {
  nombre: string;
  apellido: string;
  cursoId: string;
  email?: string;
  status?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

type ImportStudentsModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export default function ImportStudentsModal({ open: externalOpen, onOpenChange: externalOnOpenChange, showTrigger = true }: ImportStudentsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [csvData, setCsvData] = useState<CSVStudent[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener cursos para validación
  const { data: courses } = useFirestoreCollection("courses");

  const validateStudent = (student: CSVStudent): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar campos requeridos
    if (!student.nombre || student.nombre.trim() === '') {
      errors.push('Nombre es requerido');
    }
    if (!student.apellido || student.apellido.trim() === '') {
      errors.push('Apellido es requerido');
    }
    if (!student.cursoId || student.cursoId.trim() === '') {
      errors.push('cursoId es requerido');
    }

    // Validar que el curso existe
    if (student.cursoId && courses) {
      const courseExists = courses.some((c) => c.firestoreId === student.cursoId);
      if (!courseExists) {
        errors.push(`Curso con ID "${student.cursoId}" no existe`);
      }
    }

    // Validar email si está presente
    if (student.email && student.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(student.email)) {
        errors.push('Email no tiene formato válido');
      }
    }

    // Validar status si está presente
    if (student.status && student.status.trim() !== '') {
      const validStatuses = ['active', 'inactive', 'activo', 'inactivo'];
      if (!validStatuses.includes(student.status.toLowerCase())) {
        warnings.push('Status debería ser "active" o "inactive"');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const parseCSV = (csvText: string): CSVStudent[] => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Detectar delimitador (coma o punto y coma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(',') ? ',' : ';';

    // Parsear headers
    const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
    
    // Validar headers mínimos
    const requiredHeaders = ['nombre', 'apellido', 'cursoid'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Headers faltantes: ${missingHeaders.join(', ')}`);
    }

    // Parsear datos
    const students: CSVStudent[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim());
      const student: CSVStudent = {
        nombre: values[headers.indexOf('nombre')] || '',
        apellido: values[headers.indexOf('apellido')] || '',
        cursoId: values[headers.indexOf('cursoid')] || '',
        email: headers.includes('email') ? values[headers.indexOf('email')] : undefined,
        status: headers.includes('status') ? values[headers.indexOf('status')] : undefined
      };
      students.push(student);
    }

    return students;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const students = parseCSV(csvText);
        setCsvData(students);
        
        // Validar todos los estudiantes
        const results = students.map((student) => 
          validateStudent(student)
        );
        setValidationResults(results);
      } catch (error) {
        console.error("Error al procesar el CSV:", error);
      }
    };
    reader.readAsText(file);
  };

  const importStudents = async () => {
    if (csvData.length === 0) return;

    setIsProcessing(true);
    let success = 0;
    let errors = 0;

    for (let i = 0; i < csvData.length; i++) {
      const student = csvData[i];
      const validation = validationResults[i];

      if (validation.isValid) {
        try {
          await addDoc(collection(db, "students"), {
            nombre: student.nombre.trim(),
            apellido: student.apellido.trim(),
            cursoId: student.cursoId.trim(),
            email: student.email?.trim() || null,
            status: student.status?.toLowerCase() || 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          success++;
        } catch (error) {
          console.error(`Error importando estudiante ${i + 1}:`, error);
          errors++;
        }
      } else {
        errors++;
      }
    }

    setImportResults({
      success,
      errors,
      total: csvData.length
    });
    setIsProcessing(false);
    
    if (success > 0) {
      toast.success('Importación completada', {
        description: `${success} estudiantes importados exitosamente${errors > 0 ? `, ${errors} errores` : ''}`
      });
    } else if (errors > 0) {
      toast.error('Error en la importación', {
        description: `${errors} errores durante la importación`
      });
    }
  };

  const downloadTemplate = () => {
    const template = `nombre,apellido,cursoId,email,status
Juan,Pérez,nm9vFQT5a3k6K9zxrp5Y,juan.perez@email.com,active
María,González,FyARiFQeVrYUbD1DEevo,maria.gonzalez@email.com,active
Carlos,Rodríguez,xwJLTZ0InAN52zIzVYJg,carlos.rodriguez@email.com,active`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_estudiantes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setCsvData([]);
    setValidationResults([]);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validStudents = validationResults.filter((r: ValidationResult) => r.isValid).length;
  const invalidStudents = validationResults.filter((r: ValidationResult) => !r.isValid).length;

  const content = (
    <div className="space-y-6">
      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instrucciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              El archivo CSV debe contener las siguientes columnas:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>nombre</strong> (requerido) - Nombre del estudiante</li>
              <li><strong>apellido</strong> (requerido) - Apellido del estudiante</li>
              <li><strong>cursoId</strong> (requerido) - ID del curso donde inscribir al estudiante</li>
              <li><strong>email</strong> (opcional) - Email del estudiante</li>
              <li><strong>status</strong> (opcional) - Estado del estudiante (active/inactive)</li>
            </ul>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload */}
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

      {/* Preview y Validación */}
      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vista Previa ({csvData.length} estudiantes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Resumen de validación */}
              <div className="flex gap-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {validStudents} válidos
                </Badge>
                {invalidStudents > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    {invalidStudents} con errores
                  </Badge>
                )}
              </div>

              {/* Tabla de preview */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Nombre</th>
                      <th className="text-left p-2">Apellido</th>
                      <th className="text-left p-2">Curso ID</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((student, index) => {
                      const validation = validationResults[index];
                      return (
                        <tr key={index} className="border-b">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">{student.nombre}</td>
                          <td className="p-2">{student.apellido}</td>
                          <td className="p-2">
                            <code className="text-xs bg-gray-100 px-1 rounded">
                              {student.cursoId}
                            </code>
                          </td>
                          <td className="p-2">{student.email || '-'}</td>
                          <td className="p-2">{student.status || 'active'}</td>
                          <td className="p-2">
                            {validation.isValid ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Válido
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Error
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Errores detallados */}
              {invalidStudents > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Errores encontrados:</p>
                      {validationResults.map((result, index) => {
                        if (!result.isValid) {
                          return (
                            <div key={index} className="text-sm">
                              <strong>Línea {index + 2}:</strong>
                              <ul className="ml-4 mt-1">
                                {result.errors.map((error, errorIndex) => (
                                  <li key={errorIndex} className="text-red-600">• {error}</li>
                                ))}
                                {result.warnings.map((warning, warningIndex) => (
                                  <li key={warningIndex} className="text-yellow-600">• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados de importación */}
      {importResults && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Importación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
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
      <Button variant="outline" onClick={resetForm}>
        Limpiar
      </Button>
      <Button 
        onClick={importStudents}
        disabled={isProcessing || validStudents === 0}
        className="bg-green-600 hover:bg-green-700"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Importando...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Importar {validStudents} Estudiantes
          </>
        )}
      </Button>
    </div>
  );

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  return (
    <ReutilizableDialog
      triger={showTrigger && externalOpen === undefined ? (
        <span className="flex items-center gap-2">
          <Upload className="" />
          Importar Estudiantes
        </span>
      ) : undefined}
      background
      title="Importar Estudiantes desde CSV"
      description="Sube un archivo CSV para importar múltiples estudiantes de una vez"
      content={content}
      footer={footer}
      open={isOpen}
      onOpenChange={handleOpenChange}
      small={false}
    />
  );
} 
