import type { ColumnDef } from "@tanstack/react-table";

export interface CalificacionesRow {
  id: string | undefined;  // firestoreId
  Actividad: string;
  Nombre: string;
  Comentario: string;
  Valor: number;
  Materia: string;
  fecha: string;
}

// Acepta user como argumento
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
];

return columns;
  }

