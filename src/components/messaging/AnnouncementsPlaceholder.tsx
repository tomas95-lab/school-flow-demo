import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function AnnouncementsPlaceholder() {
  return (
    <div className="space-y-4">
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-700" />
        <AlertDescription className="text-yellow-800">
          Anuncios está en desarrollo. Pronto podrás publicar y gestionar comunicados.
        </AlertDescription>
      </Alert>
      <div className="h-64 rounded-xl border border-dashed border-yellow-200 bg-yellow-50/30 flex items-center justify-center text-yellow-700">
        Próximamente: publicación, prioridades, etiquetas y comentarios.
      </div>
    </div>
  );
}


