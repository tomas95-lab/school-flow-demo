import type { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { formatISO } from "date-fns";
import { db } from "@/firebaseConfig"

export interface CalificacionesRow {
  id: string | undefined;  // firestoreId
  Actividad: string;
  Nombre: string;
  Comentario: string;
  Valor: number;
  SubjectNombre: string;
  fecha: string;
}

export function useColumnsDetalle(): ColumnDef<CalificacionesRow>[] {
  return [
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
    },
    {
      accessorKey: "SubjectNombre",
      header: "Materia",
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => {
        // forzamos a any para poder llamar toDate()
        const raw = (row.original.fecha as any);
        const date = raw?.toDate
          ? raw.toDate()
          : new Date(raw);
        return date.toLocaleString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
  ];
}
