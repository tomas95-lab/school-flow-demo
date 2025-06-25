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
      cell: ({ row }) => {
        const v = row.getValue<number>("Valor");
        return (
          <span className={v < 7 ? "text-red-500" : "text-green-500"}>
            {v}
          </span>
        );
      },
      filterFn: (row, id, filterValue) => {
        const val = row.getValue<number>(id);
        if (filterValue === "Aprobados")   return val >= 7;
        if (filterValue === "Desaprobados") return val < 7;
        return true; // cualquier otro caso muestra todo
      },
    },

    {
      accessorKey: "Materia",
      header: "Materia",
    },
    {
      id: "fecha",
      header: "Fecha",
      accessorFn: row => {
        const raw = row.fecha as any;
        return raw?.toDate ? raw.toDate() : new Date(raw);
      },
      cell: ({ getValue }) => {
        const date = getValue() as Date;
        return date.toLocaleDateString("es-AR");
      },
      // filtro rango entre dos fechas YYYY-MM-DD
      filterFn: (row, id, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length !== 2) return true;
        const [from, to] = filterValue as [string, string];
        const date = row.getValue(id) as Date;
        return (
          date >= new Date(from + "T00:00:00") &&
          date <= new Date(to + "T23:59:59")
        );
      },
    },
  ];
}