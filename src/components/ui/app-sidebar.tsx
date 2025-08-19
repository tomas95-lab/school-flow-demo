import * as React from "react"
import { useContext, useMemo } from "react"
import { AuthContext } from "@/context/AuthContext"
import { usePermission } from "@/hooks/usePermission"
import { NavLink, useLocation } from "react-router-dom"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  LayoutDashboard,
  CalendarCheck2,
  NotebookText,
  FileText,
  MessagesSquare,
  Bell,
  Users2,
  BookOpen,
  Layers3,
  Bot,
  LineChart,
  Settings2
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Inicio",
      url: "/app/dashboard",
      isActive: true,
      items: [
        { title: "Dashboard", url: "/app/dashboard", isActive: false },
      ],
    },
    {
      title: "Académico",
      url: "/app/academic",
      isActive: false,
      items: [
        { title: "Asistencias", url: "/app/asistencias", isActive: false },
        { title: "Calificaciones", url: "/app/calificaciones", isActive: false },
        { title: "Boletines", url: "/app/boletines", isActive: false },
      ],
    },
    {
      title: "Comunicación",
      url: "/app/comunicacion",
      isActive: false,
      items: [
        { title: "Mensajes", url: "/app/mensajes", isActive: false },
        { title: "Alertas", url: "/app/alertas", isActive: false },
      ],
    },
    {
      title: "Gestión",
      url: "/app/gestion",
      isActive: false,
      items: [
        { title: "Usuarios", url: "/app/usuarios", isActive: false },
        { title: "Cursos y Materias", url: "/app/gestion-cursos-materias", isActive: false },
        { title: "Inscripciones", url: "/app/inscripciones", isActive: false },
        { title: "Finanzas", url: "/app/finanzas", isActive: false },
      ],
    },
    {
      title: "IA & Reportes",
      url: "/app/ia",
      isActive: false,
      items: [
        { title: "Reportes Inteligentes", url: "/app/reportes", isActive: false },
        { title: "Explicación Boletín", url: "/app/explicacion-boletin", isActive: false },
        { title: "Bot IA", url: "/app/bot", isActive: false },
        { title: "Intervenciones", url: "/app/intervenciones", isActive: false },
        { title: "Panel 360", url: "/app/360", isActive: false },
        { title: "Auditoría", url: "/app/auditoria", isActive: false },
      ],
    },
  ],
};

  
  

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Se mantiene para posibles futuros condicionamientos visuales (tema, avatar)
  void useContext(AuthContext)
  const { can } = usePermission()
  const location = useLocation()
  const isMobile = useIsMobile()
  const { setOpenMobile } = useSidebar()

  const iconMap: Record<string, React.ElementType> = {
    "Dashboard": LayoutDashboard,
    "Asistencias": CalendarCheck2,
    "Calificaciones": NotebookText,
    "Boletines": FileText,
    "Mensajes": MessagesSquare,
    "Alertas": Bell,
    "Usuarios": Users2,
    "Cursos y Materias": Layers3,
    "Inscripciones": BookOpen,
    "Reportes Inteligentes": LineChart,
    "Explicación Boletín": FileText,
    "Bot IA": Bot,
    "Intervenciones": LineChart,
    "Panel 360": LineChart,
    "General": Settings2,
  }

  const { user } = useContext(AuthContext)
  const isAlumno = user?.role === 'alumno'

  // Función para cerrar el sidebar en móviles cuando se hace clic en un enlace
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  // Filtrar elementos del menú según el rol del usuario
  const filteredNavMain = useMemo(() => data.navMain.map(group => {
    // Si es el grupo "Gestión", filtrar elementos según el rol
    if (group.title === "Gestión") {
      const filteredItems = group.items.filter(item => {
        if (item.title === "Usuarios") {
          return can("canManageUsers" as any)
        }
        if (item.title === "Cursos y Materias") {
          return can("canManageCourses" as any) || can("canAssignSections" as any)
        }
        if (item.title === "Inscripciones") {
          return can("canManageCourses" as any)
        }
        return true
      })
      
      // Solo mostrar el grupo si tiene elementos
      if (filteredItems.length === 0) {
        return null
      }
      
      return {
        ...group,
        items: filteredItems
      }
    }
    
    // Para otros grupos, aplicar filtros adicionales para alumno
    let items = group.items
    if (isAlumno) {
      items = items.filter(item => ![
        'Intervenciones',
        'Bot IA',
        'Auditoría',
        'Reportes Inteligentes',
      ].includes(item.title))
    }

    return { ...group, items }
  }).filter(Boolean), [can, isAlumno]) // Remover grupos vacíos

  return (
    <Sidebar {...props}>
      <SidebarHeader>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavMain.map((item) => item && (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((menuItem) => {
                  const isActive = location.pathname === menuItem.url || location.pathname.startsWith(menuItem.url + "/")
                  const Icon = iconMap[menuItem.title] || LayoutDashboard
                  return (
                    <SidebarMenuItem key={menuItem.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild isActive={isActive} aria-label={menuItem.title}>
                            <NavLink 
                              to={menuItem.url} 
                              className="flex items-center gap-2"
                              onClick={handleNavClick}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{menuItem.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">{menuItem.title}</TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
