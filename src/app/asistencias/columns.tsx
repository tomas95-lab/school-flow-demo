"use client"

import type { ColumnDef } from "@tanstack/react-table"
 
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Student = {
  id: string
  Nombre: string,
  presente: boolean, 
  fecha: string,
}

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "presente",
    header: "Presente",
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
  },
]