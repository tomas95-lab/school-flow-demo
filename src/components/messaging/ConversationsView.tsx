import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { MessageSquare, Clock, Users, Settings, Code, GitBranch, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

export default function ConversationsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conversaciones</h2>
          <p className="text-gray-600">Chats y mensajes directos entre usuarios</p>
        </div>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          <Code className="h-3 w-3 mr-1" />
          En Desarrollo
        </Badge>
      </div>

      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Esta funcionalidad está actualmente en desarrollo. Próximamente podrás chatear directamente con otros usuarios del sistema.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <MessageSquare className="h-5 w-5" />
              Chat Directo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Mensajes Privados</h3>
              <p className="text-gray-500 text-sm mb-4">
                Envía mensajes directos a otros usuarios del sistema
              </p>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <GitBranch className="h-3 w-3 mr-1" />
                Próximamente
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <Users className="h-5 w-5" />
              Grupos de Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Conversaciones Grupales</h3>
              <p className="text-gray-500 text-sm mb-4">
                Crea grupos de chat para equipos o clases específicas
              </p>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <GitBranch className="h-3 w-3 mr-1" />
                Próximamente
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <Clock className="h-5 w-5" />
              Historial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Conversaciones Recientes</h3>
              <p className="text-gray-500 text-sm mb-4">
                Accede a tus conversaciones anteriores
              </p>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <GitBranch className="h-3 w-3 mr-1" />
                Próximamente
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Funcionalidades Planificadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Características Principales</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Mensajes directos entre usuarios
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Grupos de chat por curso/materia
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Notificaciones en tiempo real
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Historial de conversaciones
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Funcionalidades Avanzadas</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Envío de archivos y multimedia
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Estados de lectura y entrega
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Búsqueda de mensajes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Configuración de privacidad
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 