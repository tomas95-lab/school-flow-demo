import { GraduationCap } from "lucide-react";

interface SchoolSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export function SchoolSpinner({ text = "Cargando...", fullScreen = false }: SchoolSpinnerProps) {
  const SpinnerVisual = (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        {/* Anillo giratorio con degradado */}
        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 animate-spin-slow [mask-image:radial-gradient(transparent_58%,black_60%)]" />
        {/* Icono centrado */}
        <div className="absolute inset-0 flex items-center justify-center">
          <GraduationCap className="text-indigo-700 h-7 w-7 animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-800">{text}</p>
        <p className="text-xs text-gray-500">Preparando información del sistema…</p>
      </div>
      {/* Barra de progreso indeterminada */}
      <div className="w-56 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-[indeterminate_1.2s_ease-in-out_infinite]" />
      </div>
      {/* Keyframes inline via style tag alternative: usar utilidades arbitrias */}
      <style>{`@keyframes indeterminate{0%{transform:translateX(-150%)}50%{transform:translateX(60%)}100%{transform:translateX(150%)}}`}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        {SpinnerVisual}
      </div>
    );
  }

  return SpinnerVisual;
}

