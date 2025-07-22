import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2, Users, GraduationCap, Eye, BookOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { BoletinView } from "@/components/BoletinView";
import { generarPDFBoletin } from "@/utils/boletines";

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

const getBoletinStatus = (estado: string, leido?: boolean) => {
	switch (estado) {
		case "generado":
			return {
				icon: BookOpen,
				label: "Generado",
				color: "bg-blue-100 text-blue-700 border-blue-200",
				description: "Boletín generado y listo para revisión"
			};
		case "leido":
			return {
				icon: Eye,
				label: "Leído",
				color: "bg-green-100 text-green-700 border-green-200",
				description: "Boletín revisado por el estudiante"
			};
		case "cerrado":
			return {
				icon: Trash2,
				label: "Cerrado",
				color: "bg-red-100 text-red-700 border-red-200",
				description: "Boletín cerrado y finalizado"
			};
		default:
			return {
				icon: Users,
				label: "Pendiente",
				color: "bg-yellow-100 text-yellow-700 border-yellow-200",
				description: "Boletín en proceso de generación"
			};
	}
};

export function useColumnsDetalle(user: any): ColumnDef<BoletinceRow>[] {
	return [
		{
			accessorKey: "Nombre",
			header: "Estudiante",
			cell: ({ row }) => {
				const alertas = row.getValue<number>("alertas");
				return (
					<div className="flex items-center space-x-2">
						<Users className={`w-4 h-4 ${alertas > 0 ? 'text-red-500' : 'text-green-500'}`} />
						<span className={alertas > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
							{row.getValue("Nombre")}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: "promediototal",
			header: "Promedio",
			cell: ({ row }) => {
				const promedio = row.getValue<number>("promediototal");
				return (
					<div className="flex items-center space-x-2">
						<GraduationCap className="w-4 h-4 text-blue-500" />
						<span className="font-medium">{promedio.toFixed(1)}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "estado",
			header: "Estado",
			cell: ({ row }) => {
				const estado = row.getValue<string>("estado");
				const status = getBoletinStatus(estado);
				const Icon = status.icon;
				
				return (
					<Badge className={status.color}>
						<Icon className="w-3 h-3 mr-1" />
						{status.label}
					</Badge>
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
						<Users className={`w-4 h-4 ${alertas > 0 ? 'text-red-500' : 'text-green-500'}`} />
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
		cell: ({ row }) => {
			const handleDownloadPDF = async () => {
				try {
					await generarPDFBoletin(row.original);
				} catch (error) {
					console.error('Error al generar PDF:', error);
					alert('Error al generar el PDF. Inténtalo de nuevo.');
				}
			};

			return (
				<div className="flex items-center space-x-2">
					<BoletinView row={row.original} />
					{row.original.estado === "generado" && (
						<Button
							size="sm"
							variant="outline"
							className="text-blue-600 border-blue-200 hover:bg-blue-50"
							onClick={handleDownloadPDF}
						>
							<BookOpen className="w-4 h-4 mr-1" />
							PDF
						</Button>
					)}
				</div>
			);
		},
		},
	];
}
