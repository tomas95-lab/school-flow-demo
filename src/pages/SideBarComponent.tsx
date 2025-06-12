import { AppSidebar } from "@/components/ui/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

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

// Lista de rutas válidas reales extraídas del sidebar
const validRoutes = [
  "/dashboard",
  "/academic",
  "/asistencias",
  "/calificaciones",
  "/boletines",
  "/comunicacion",
  "/mensajes",
  "/alertas",
  "/gestion",
  "/usuarios",
  "/cursos",
  "/inscripciones",
  "/ia",
  "/reportes",
  "/boletines/explicacion",
  "/configuracion",
  "/configuracion/general",
  "/configuracion/bot"
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
                {urlParts[0] !== 'dashboard' && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink 
                        onClick={() => safeNavigate('/dashboard')}
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
            <Badge className="ml-4">
                {user?.role === 'admin'? 'Administrador'
                  : user?.role === 'docente'
                  ? 'Docente'
                  : user?.role === 'familiar'
                  ? 'Familiar'
                  : 'Invitado'}
            </Badge>  
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
