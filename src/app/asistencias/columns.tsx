import type { ColumnDef } from "@tanstack/react-table"

export interface AttendanceRow {
  id: string | undefined
  Nombre: string
  presente: boolean
  fecha: string
}

export const columnsDetalle: ColumnDef<AttendanceRow>[] = [
  {
    accessorKey: "Nombre",
    header: "Nombre",
  },
  {
    accessorKey: "presente",
    header: "Presente",
    cell: ({ row }) => {
      const value = row.getValue("presente");
      const isPresente = value === true;
      return (
        <span className={isPresente ? "text-green-500" : "text-red-500"}>
          {isPresente ? "Presente" : "Ausente"}
        </span>
      );
    },
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
  },
]