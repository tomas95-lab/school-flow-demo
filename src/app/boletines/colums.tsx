import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, Clock, FileText, AlertCircle, Download } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { BoletinView } from "@/components/BoletinView";

export interface BoletinceRow {
  id: string | undefined;  // firestoreId
  Nombre: string;
  promediototal: number;
  estado: "cerrado" | "abierto" | "generado" | "leido" | "pendiente";
  alertas: number;
  periodo?: string;
  fechaGeneracion?: string;
  fechaLectura?: string;
  leido?: boolean;
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

// Función para obtener el estado visual del boletín
const getBoletinStatus = (estado: string, leido?: boolean) => {
  switch (estado) {
    case "generado":
      return {
        icon: FileText,
        label: "Generado",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        description: "Boletín listo para revisar"
      };
    case "leido":
      return {
        icon: CheckCircle,
        label: "Leído",
        color: "bg-green-100 text-green-700 border-green-200",
        description: "Boletín revisado"
      };
    case "abierto":
      return {
        icon: Eye,
        label: "Abierto",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        description: "Disponible para consulta"
      };
    case "cerrado":
      return {
        icon: AlertCircle,
        label: "Cerrado",
        color: "bg-red-100 text-red-700 border-red-200",
        description: "Período finalizado"
      };
    case "pendiente":
    default:
      return {
        icon: Clock,
        label: "Pendiente",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        description: "En proceso de generación"
      };
  }
};

export function useColumnsDetalle(user: any): ColumnDef<BoletinceRow>[] {
  return [
    {
      accessorKey: "Nombre",
      header: "Nombre",
    },
    {
      accessorKey: "promediototal",
      header: "Promedio",
      cell: ({ row }) => {
        const promedio = row.getValue<number>("promediototal");
        return (
          <div className="flex items-center space-x-2">
            <span className="font-semibold">{promedio.toFixed(1)}</span>
            <span className="text-xs text-gray-500">/10</span>
          </div>
        );
      },
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = row.getValue<string>("estado");
        const leido = row.original.leido;
        const status = getBoletinStatus(estado, leido);
        const Icon = status.icon;
        
        return (
          <div className="flex items-center space-x-2">
            <Badge className={`${status.color} flex items-center space-x-1`}>
              <Icon className="w-3 h-3" />
              <span>{status.label}</span>
            </Badge>
            <div className="text-xs text-gray-500 hidden md:block">
              {status.description}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "alertas",
      header: "Alertas",
      cell: ({ row }) => {
        const alertas = row.getValue<number>("alertas");
        return (
          <div className="flex items-center space-x-2">
            <AlertCircle className={`w-4 h-4 ${alertas > 0 ? 'text-red-500' : 'text-green-500'}`} />
            <span className={alertas > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
              {alertas}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "fechaGeneracion",
      header: "Fecha",
      cell: ({ row }) => {
        const fecha = row.getValue<string>("fechaGeneracion");
        const fechaLectura = row.original.fechaLectura;
        
        return (
          <div className="text-sm text-gray-600">
            <div>Generado: {fecha ? new Date(fecha).toLocaleDateString('es-ES') : 'N/A'}</div>
            {fechaLectura && (
              <div className="text-xs text-green-600">
                Leído: {new Date(fechaLectura).toLocaleDateString('es-ES')}
              </div>
            )}
          </div>
        );
      },
    },
    {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <BoletinView row={row.original} />
        {row.original.estado === "generado" && (
          <Button
            size="sm"
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
        )}
      </div>
    ),
    },
  ];
}
