import type { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { formatISO } from "date-fns";
import { db } from "@/firebaseConfig"
import { Badge } from "@/components/ui/badge";

export interface AttendanceRow {
  id: string | undefined;  // firestoreId
  Nombre: string;
  present: boolean;
  fecha: string;
  idAsistencia: string;
}

export function useColumnsDetalle(user: any): ColumnDef<AttendanceRow>[] {
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
          <Badge  variant={value ? "success" : "destructive"} >
            {value ? "Presente" : "Ausente"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
    },
    ...(user?.role == "admin" || user?.role == "docente"
      ? [
          {
            id: "action",
            header: "Acción",
            cell: ({ row }: { row: import("@tanstack/react-table").Row<AttendanceRow> }) => {
              const attendanceId = row.original.idAsistencia;
              const current = row.original.present;

              const toggle = async () => {
                console.log(current)
                if (!attendanceId) return;
                const ref = doc(db, "attendances", attendanceId);
                await updateDoc(ref, {
                  present: !current,
                  fecha: formatISO(new Date(), { representation: "date" }),
                });
              };

              return (
                <button
                  onClick={toggle}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                  title={current ? "Marcar ausente" : "Marcar presente"}
                >
                  {current ? (
                    <X className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </button>
              );
            },
          },
        ]
      : []),
  ];
}
