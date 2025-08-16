import React from "react";
import ReutilizableDialog from "@/components/DialogReutlizable";
import type { ColumnDef } from "@tanstack/react-table";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Pencil, Award, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Edit } from 'lucide-react';
import EditCalificaciones from "@/components/EditCalificaciones";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Badge } from "@/components/ui/badge";

export interface CalificacionesRow {
  id: string | undefined;  // firestoreId
  Actividad: string;
  Nombre: string;
  Comentario: string;
  Valor: number;
  Materia: string;
  fecha: string;
}
import { Button } from "@/components/ui/button";

// Función para obtener el color y icono según la calificación
const getGradeStyle = (grade: number) => {
  if (grade >= 9) {
    return {
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: <Award className="h-3 w-3 text-emerald-600" />,
      label: "Excelente"
    };
  } else if (grade >= 8) {
    return {
      color: "text-black-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: <CheckCircle className="h-3 w-3 text-green-600" />,
      label: "Muy Bueno"
    };
  } else if (grade >= 7) {
    return {
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: <CheckCircle className="h-3 w-3 text-blue-600" />,
      label: "Bueno"
    };
  } else if (grade >= 6) {
    return {
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      icon: <AlertTriangle className="h-3 w-3 text-yellow-600" />,
      label: "Regular"
    };
  } else {
    return {
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: <XCircle className="h-3 w-3 text-red-600" />,
      label: "Necesita Mejora"
    };
  }
};

// Función para obtener el icono de tendencia
const getTrendIcon = (grade: number) => {
  if (grade >= 8) return <TrendingUp className="h-3 w-3 text-green-600" />;
  if (grade >= 6) return <Minus className="h-3 w-3 text-yellow-600" />;
  return <TrendingDown className="h-3 w-3 text-red-600" />;
};

// Separate component to handle the cell with hooks
function EditGradeCell({ row }: { row: { original: CalificacionesRow } }) {
  const [formData, setFormData] = React.useState({
    student: row.original.Nombre,
    subject: row.original.Materia,
    activity: row.original.Actividad || "",
    grade: row.original.Valor?.toString() ?? "",
    date: row.original.fecha || "",
    comment: row.original.Comentario || "",
  });
  const [errors, setErrors] = React.useState<{ [key: string]: string | null }>({ grade: null, date: null, comment: null });
  const [loading, setLoading] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  // Handlers for form fields
  const handleGradeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, grade: value }));
    const num = Number(value);
    setErrors((prev) => ({
      ...prev,
      grade: isNaN(num) || num < 0 || num > 10 ? "Debe ser un número entre 0 y 10" : null,
    }));
  };
  
  const handleDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, date: value }));
    setErrors((prev) => ({
      ...prev,
      date: !value ? "La fecha es obligatoria" : null,
    }));
  };
  
  const handleCommentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, comment: value }));
    setErrors((prev) => ({
      ...prev,
      comment: value.length > 500 ? "Máximo 500 caracteres" : null,
    }));
  };
  
  const handleActivityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, activity: value }));
  };
  
  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    try {
      if (!row.original.id) throw new Error("ID de calificación no definido");
      await updateDoc(doc(db, "calificaciones", row.original.id), {
        Actividad: formData.activity,
        valor: Number(formData.grade),
        fecha: formData.date,
        Comentario: formData.comment,
        Materia: formData.subject,
        Nombre: formData.student,
      });
      setLoading(false);
      setOpen(false); // Cierra el diálogo al guardar
      // Opcional: feedback visual, cerrar modal, refrescar datos, etc.
    } catch (error) {
      setLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar la calificación";
      setSubmitError(errorMessage);
    }
  };
  
  const handleCancel = () => {
    setOpen(false); // Cierra el diálogo al cancelar
  };

  return (
    <div className="pl-4">
      <ReutilizableDialog 
        small
        open={open}
        onOpenChange={setOpen}
        title={
          <div className="flex items-center gap-2">
            <Edit className="text-blue-600" />
            Editar Calificación
          </div>
        }             
        description={`Modifica los detalles de la evaluación del estudiante`}
        content={
          <>
            <EditCalificaciones
              formData={formData}
              errors={errors}
              handleGradeChange={handleGradeChange}
              handleDateChange={handleDateChange}
              handleCommentChange={handleCommentChange}
              handleActivityChange={handleActivityChange}
              handleSubmit={handleSubmit}
              handleCancel={handleCancel}
            />
            {loading && (
              <div className="text-blue-600 text-sm mt-2">Guardando cambios...</div>
            )}
            {submitError && (
              <div className="text-red-600 text-sm mt-2">{submitError}</div>
            )}
          </>
        }
        triger={
            <Pencil className="h-4 w-4" />
        }
      />
    </div>
  );
}

export function useColumnsDetalle(): ColumnDef<CalificacionesRow>[] {
  const { user } = useContext(AuthContext);
  const canEdit = user?.role === "admin" || user?.role === "docente";

  const columns: ColumnDef<CalificacionesRow>[] = [
    {
      accessorKey: "Nombre",
      header: "Estudiante",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {row.original.Nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.original.Nombre}</p>
            <p className="text-xs text-gray-500">Estudiante</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "actividad",
      header: "Actividad",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="p-1 bg-gray-100 rounded">
            <Award className="h-3 w-3 text-gray-600" />
          </div>
          <span className="font-medium text-gray-900">
            {row.original.Actividad || "Evaluación"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "Valor",
      header: "Calificación",
      cell: ({ row }) => {
        const grade = row.getValue<number>("Valor");
        const gradeStyle = getGradeStyle(grade);
        
        return (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${gradeStyle.bgColor} ${gradeStyle.color} ${gradeStyle.borderColor} border font-medium`}
            >
              {gradeStyle.icon}
              <span className="ml-1">{grade}</span>
            </Badge>
            <div className="flex items-center gap-1">
              {getTrendIcon(grade)}
              <span className="text-xs text-gray-500">{gradeStyle.label}</span>
            </div>
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        const val = row.getValue<number>(id);
        if (filterValue === "Aprobados")   return val >= 7;
        if (filterValue === "Desaprobados") return val < 7;
        return true;
      },
    },
    {
      accessorKey: "Materia",
      header: "Materia",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-100 rounded">
            <TrendingUp className="h-3 w-3 text-blue-600" />
          </div>
          <span className="font-medium text-gray-900">{row.original.Materia}</span>
        </div>
      ),
    },
    {
      accessorKey: "Comentario",
      header: "Comentario",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-700 line-clamp-2">
            {row.original.Comentario}
          </p>
          {row.original.Comentario.length > 50 && (
            <p className="text-xs text-gray-500 mt-1">
              {row.original.Comentario.length} caracteres
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => {
        const fecha = row.original.fecha;
        const date = new Date(fecha);
        const isToday = new Date().toDateString() === date.toDateString();
        
        return (
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded ${isToday ? 'bg-green-100' : 'bg-gray-100'}`}>
              <div className={`text-xs ${isToday ? 'text-green-600' : 'text-gray-600'}`}>
                {date.toLocaleDateString('es-ES', { 
                  day: '2-digit', 
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            </div>
            {isToday && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                Hoy
              </Badge>
            )}
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        // filterValue: [start, end] en formato "yyyy-MM-dd"
        if (!Array.isArray(filterValue) || filterValue.length !== 2) return true;
        const [start, end] = filterValue;
        if (!start || !end) return true;
        // Convierte la fecha de la fila y los filtros a Date
        // Asume que row.getValue(id) puede venir en formato "yyyy-MM-dd" o similar
        const rowDateStr = row.getValue<string>(id);
        // Intenta parsear la fecha de la fila
        let rowDate: Date | null = null;
        if (rowDateStr) {
          // Si ya viene en formato yyyy-MM-dd
          if (/^\d{4}-\d{2}-\d{2}$/.test(rowDateStr)) {
            rowDate = new Date(rowDateStr + "T00:00:00");
          } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rowDateStr)) {
            // Si viene en formato dd/MM/yyyy
            const [d, m, y] = rowDateStr.split("/");
            rowDate = new Date(`${y}-${m}-${d}T00:00:00`);
          } else {
            // Intenta parsear como Date normal
            rowDate = new Date(rowDateStr);
          }
        }
        const startDate = new Date(start + "T00:00:00");
        const endDate = new Date(end + "T23:59:59");
        if (!rowDate || isNaN(rowDate.getTime())) return false;
        return rowDate >= startDate && rowDate <= endDate;
      },
    },
  ];

  if (canEdit) {
    columns.push({
      accessorKey: "id",
      header: "Acciones",
      cell: ({ row }) => <EditGradeCell row={row} />,
    });
  }

  return columns;
}

