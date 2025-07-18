import { GraduationCap } from "lucide-react";

interface SchoolSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export function SchoolSpinner({ text = "Cargando...", fullScreen = false }: SchoolSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/95 backdrop-blur-sm">
        <GraduationCap className="animate-spin-slow text-blue-700 w-12 h-12" />
        <span className="text-gray-500">{text}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <GraduationCap className="animate-spin-slow text-blue-700 w-12 h-12" />
      <span className="text-gray-500">{text}</span>
    </div>
  );
}

