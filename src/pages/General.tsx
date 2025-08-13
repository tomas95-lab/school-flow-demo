import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"

export default function GeneralPlaceholder() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl shadow-lg">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">General</h1>
            <p className="text-gray-600">Módulo en desarrollo</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>En desarrollo</CardTitle>
            <CardDescription>Estamos trabajando para habilitar esta sección.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="outline" className="border-gray-300 text-gray-700">Próximamente</Badge>
              Funcionalidades avanzadas de configuración general
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


