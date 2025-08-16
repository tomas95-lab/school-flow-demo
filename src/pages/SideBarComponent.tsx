import { AppSidebar } from "@/components/ui/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useNavigate, useLocation } from "react-router-dom"
import React from "react"
import { Badge } from "@/components/ui/badge"
import { useContext} from "react"
import { AuthContext } from "@/context/AuthContext"
import { signOut } from "firebase/auth"
import { auth } from "@/firebaseConfig"
import { LogOut } from "lucide-react"

// Lista de rutas válidas reales extraídas del sidebar
const validRoutes = [
  "/app/dashboard",
  "/app/academic",
  "/app/asistencias",
  "/app/calificaciones",
  "/app/boletines",
  "/app/comunicacion",
  "/app/mensajes",
  "/app/alertas",
  "/app/gestion",
  "/app/usuarios",
  "/app/gestion-cursos-materias",
  "/app/inscripciones",
  "/app/ia",
  "/app/reportes",
  "/app/explicacion-boletin",
  "/app/bot",
  "/app/configuracion"
];


export default function SideBarComponent({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext)
  const location = useLocation() 
  const url = location.pathname 
  const urlArray = url.split("/") 
  const urlParts = urlArray.slice(1) 
  const urlPartsArray = urlParts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)) 

  const navigate = useNavigate()

  const isValidRoute = (path: string[]) => {
    const route = "/" + path.join("/");
    return validRoutes.includes(route);
  };

  const getBreadcrumbPath = (index: number) => {
    const pathParts = urlParts.slice(0, index + 1);
    if (isValidRoute(pathParts)) {
      return '/' + pathParts.join('/');
    }
    return null;
  }

  const safeNavigate = (path: string | null) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex w-full h-16 shrink-0 items-center gap-2 border-b px-4 bg-white z-50">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center justify-between w-full">
            <Breadcrumb>
              <BreadcrumbList>
                {urlParts[0] !== 'app' && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink 
                        onClick={() => safeNavigate('/app/dashboard')}
                        className="cursor-pointer"
                      >
                        Home
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}

                {urlPartsArray.map((path, index) => {
                  const breadcrumbPath = getBreadcrumbPath(index);
                  return (
                    <React.Fragment key={index}>
                      <BreadcrumbItem>
                        <BreadcrumbLink 
                          onClick={() => safeNavigate(breadcrumbPath)}
                          className={`${breadcrumbPath ? 'cursor-pointer hover:underline' : 'cursor-not-allowed opacity-50'}`}
                        >
                          {path === 'Dashboard' ? 'Home' : path}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {index !== urlPartsArray.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3 ml-4">
              <Badge>
                {user?.role === 'admin'? 'Administrador'
                  : user?.role === 'docente'
                  ? 'Docente'
                  : user?.role === 'alumno'
                  ? 'Alumno'
                  : 'Invitado'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await signOut(auth)
                  } finally {
                    navigate('/login')
                  }
                }}
                className="gap-2"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
