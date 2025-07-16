import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { BoletinView } from "@/components/BoletinView";

export interface BoletinceRow {
  id: string | undefined;  // firestoreId
  Nombre: string;
  promediototal: number;
  estado: "cerrado" | "abierto";
  alertas: number;
  periodo?: string;
	materias?: {
		nombre: string;
		promedio: number;
	}[];
	comentario?: string;
	// Datos de asistencia
	asistencia?: {
		total: number;
		presentes: number;
		ausentes: number;
		porcentaje: number;
	};
}

export function useColumnsDetalle(user: any): ColumnDef<BoletinceRow>[] {
  return [
    {
      accessorKey: "Nombre",
      header: "Nombre",
    },
    {
      accessorKey: "promediototal",
      header: "Promedio",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const value = row.getValue<"cerrado" | "abierto">("estado");
        return (
          <Badge  variant={value === "abierto" ? "success" : "destructive"} >
            {value === "abierto" ? "Abierto" : "Cerrado"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "alertas",
      header: "Alertas",
    },
    {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => (
      <BoletinView row={row.original}
      ></BoletinView>
    ),
    },
  ];
}
