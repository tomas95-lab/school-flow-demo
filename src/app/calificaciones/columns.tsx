import React from "react";
import ReutilizableDialog from "@/components/DialogReutlizable";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { Edit, } from 'lucide-react';
import EditCalificaciones from "@/components/EditCalificaciones";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig"; // Ajusta la ruta según tu estructura

export interface CalificacionesRow {
  id: string | undefined;  // firestoreId
  Actividad: string;
  Nombre: string;
  Comentario: string;
  Valor: number;
  Materia: string;
  fecha: string;
}

export function useColumnsDetalle(): ColumnDef<CalificacionesRow>[] {
  const columns: ColumnDef<CalificacionesRow>[] = [
    {
      accessorKey: "Nombre",
      header: "Nombre",
    },
    {
      accessorKey: "actividad",
      header: "Actividad",
      cell: ({ row }) => row.original.Actividad || "Evaluación",
    },
    {
      accessorKey: "Comentario",
      header: "Comentario",
    },
    {
      accessorKey: "Valor",
      header: "Valor",
      cell: ({ row }) => {
        const v = row.getValue<number>("Valor");
        // Si no es docente, solo muestra el valor
        return (
          <span className={v < 7 ? "text-red-500" : "text-green-500"}>
            {v ?? "Ausente"}
          </span>
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
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
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
    {
      accessorKey: "id",
      header: "Acción",
      cell: ({ row }) => {
        // Local state for dialog form
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

        // Estado para controlar el diálogo
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
          } catch (err: any) {
            setLoading(false);
            setSubmitError(err.message || "Error al actualizar la calificación");
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
                  <Edit className="h-6 w-6 text-blue-600" />
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
                <Pencil
                  className="h-4 w-4 cursor-pointer"
                  onClick={() => setOpen(true)}
                />
              }
            />
          </div>
        );
      },
    }
  ];

  return columns;
}

