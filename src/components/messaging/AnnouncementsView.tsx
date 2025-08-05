import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Megaphone, Bell, Calendar, Settings, Code, GitBranch, AlertTriangle, Users, FileText, Star } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

export default function AnnouncementsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Anuncios</h2>
          <p className="text-gray-600">Comunicaciones generales del sistema educativo</p>
        </div>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          <Code className="h-3 w-3 mr-1" />
          En Desarrollo
        </Badge>
      </div>

      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Esta funcionalidad está actualmente en desarrollo. Próximamente podrás gestionar y recibir anuncios del sistema.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-500">
              <Megaphone className="h-5 w-5" />
              Anuncios Generales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Comunicaciones Institucionales</h3>
              <p className="text-gray-500 text-sm mb-4">
                Anuncios importantes de la institución
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
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Sistema de Alertas</h3>
              <p className="text-gray-500 text-sm mb-4">
                Recibe notificaciones de anuncios importantes
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
              <Calendar className="h-5 w-5" />
              Programación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Anuncios Programados</h3>
              <p className="text-gray-500 text-sm mb-4">
                Programa anuncios para fechas específicas
              </p>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <GitBranch className="h-3 w-3 mr-1" />
                Próximamente
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Funcionalidades Planificadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Gestión de Anuncios</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Crear y editar anuncios
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Programar publicaciones
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Categorizar por tipo
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Control de permisos por rol
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Características Avanzadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Funcionalidades Avanzadas</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Notificaciones push
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Plantillas de anuncios
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Estadísticas de lectura
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    Archivo de anuncios
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Tipos de Anuncios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Institucionales</h4>
              <p className="text-xs text-gray-500">Anuncios oficiales</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Eventos</h4>
              <p className="text-xs text-gray-500">Actividades y eventos</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Urgentes</h4>
              <p className="text-xs text-gray-500">Comunicaciones urgentes</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Académicos</h4>
              <p className="text-xs text-gray-500">Información académica</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 