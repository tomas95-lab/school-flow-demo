import type { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


type Role = "admin" | "docente" | "alumno" | "familiar";

type AppUser = {
  uid: string;
  email: string | null;
  name: string | null;
  role: Role;
  teacherId: string;
  studentId: string;
};

export interface AttendanceRow {
  id: string | undefined;  // firestoreId
  Nombre: string;
  present: boolean;
  fecha: string;
  idAsistencia: string;
}

export function useColumnsDetalle(user: AppUser | null): ColumnDef<AttendanceRow>[] {
  // Verificar permisos para editar asistencias
  const canEditAttendance = user?.role === "admin" || user?.role === "docente";

  const handleToggleAttendance = async (attendanceId: string, currentStatus: boolean) => {
    if (!attendanceId || !canEditAttendance) {
      console.warn("No se puede editar: falta ID o permisos insuficientes");
      return;
    }

    try {
      const ref = doc(db, "attendances", attendanceId);
      await updateDoc(ref, {
        present: !currentStatus,
        updatedAt: new Date(),
        updatedBy: user?.uid || user?.teacherId || user?.email
      });
    } catch (error) {
      console.error("Error al actualizar asistencia:", error);
    }
  };

  return [
    {
      accessorKey: "Nombre",
      header: "Nombre",
    },
    {
      accessorKey: "present",
      header: "Presente",
      cell: ({ row }) => {
        const value = row.getValue<boolean>("present");
        return (
          <Badge variant={value ? "default" : "destructive"}>
            {value ? "Presente" : "Ausente"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => {
        const raw = row.getValue<unknown>("fecha");
        // Soporta Firestore Timestamp, ISO string, epoch ms/seconds
        let d: Date | null = null;
        try {
          if (raw && typeof raw === 'object' && 'seconds' in (raw as any)) {
            const ts = raw as { seconds: number; nanoseconds?: number };
            d = new Date(ts.seconds * 1000);
          } else if (typeof raw === 'number') {
            d = new Date(raw > 1e12 ? raw : raw * 1000);
          } else if (typeof raw === 'string') {
            const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (m) {
              const [, y, mo, da] = m;
              d = new Date(Number(y), Number(mo) - 1, Number(da));
            } else {
              const parsed = new Date(raw);
              d = isNaN(parsed.getTime()) ? null : parsed;
            }
          }
        } catch {
          d = null;
        }

        const label = d
          ? d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
          : 'N/A';

        return (
          <span className="text-sm text-gray-600">
            {label}
          </span>
        );
      },
    },
    ...(canEditAttendance
      ? [
          {
            id: "action",
            header: "Acción",
            cell: ({ row }: { row: import("@tanstack/react-table").Row<AttendanceRow> }) => {
              const attendanceId = row.original.idAsistencia;
              const current = row.original.present;

              if (!attendanceId) {
                return (
                  <div className="flex items-center gap-1 text-gray-400">
                    <span className="text-xs">Sin ID</span>
                  </div>
                );
              }

              return (
                <Button
                  onClick={() => handleToggleAttendance(attendanceId, current)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                  title={current ? "Marcar ausente" : "Marcar presente"}
                >
                  {current ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </Button>
              );
            },
          },
        ]
      : []),
  ];
}
