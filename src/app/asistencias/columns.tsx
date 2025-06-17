import type { ColumnDef } from "@tanstack/react-table";
import { Check, X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { formatISO } from "date-fns";
import { db } from "@/firebaseConfig"

export interface AttendanceRow {
  id: string | undefined;  // firestoreId
  Nombre: string;
  presente: boolean;
  fecha: string;
  idAsistencia: string;
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
      const value = row.getValue<boolean>("presente");
      return (
        <span className={value ? "text-green-500" : "text-red-500"}>
          {value ? "Presente" : "Ausente"}
        </span>
      );
    },
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
  },
  {
    id: "action",
    header: "Acción",
    cell: ({ row }) => {
      const attendanceId = row.original.idAsistencia;
      const current = row.original.presente;

      const toggle = async () => {
        if (!attendanceId) return;
        const ref = doc(db, "attendances", attendanceId);
        await updateDoc(ref, {
          presente: !current,
          fecha: formatISO(new Date(), { representation: "date" }),
        });
        // No refetch: la actualización en Firestore se refleja automáticamente si tu hook está suscrito en tiempo real
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
];
