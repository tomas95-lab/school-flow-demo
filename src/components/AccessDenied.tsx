import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

type AccessDeniedProps = {
  title?: string;
  message?: string;
};

export function AccessDenied({
  title = "Acceso Restringido",
  message = "No tienes permisos para acceder a esta sección.",
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="p-4 bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-gray-500 text-sm">
                Contacta al administrador del sistema si crees que esto es un error.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


