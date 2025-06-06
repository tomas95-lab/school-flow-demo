import { GraduationCap } from "lucide-react";

export function SchoolSpinner({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <GraduationCap className="animate-spin-slow text-blue-700 w-12 h-12" />
      <span className="text-gray-500">{text}</span>
    </div>
  );
}

