import * as React from "react"
import { useContext } from "react"
import { AuthContext } from "@/context/AuthContext"

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
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Inicio",
      url: "/dashboard",
      isActive: true,
      items: [
        { title: "Dashboard", url: "/dashboard", isActive: false },
      ],
    },
    {
      title: "Académico",
      url: "/academic",
      isActive: false,
      items: [
        { title: "Asistencias", url: "/asistencias", isActive: false },
        { title: "Calificaciones", url: "/calificaciones", isActive: false },
        { title: "Boletines", url: "/boletines", isActive: false },
      ],
    },
    {
      title: "Comunicación",
      url: "/comunicacion",
      isActive: false,
      items: [
        { title: "Mensajes", url: "/mensajes", isActive: false },
        { title: "Alertas", url: "/alertas", isActive: false },
      ],
    },
    {
      title: "Gestión",
      url: "/gestion",
      isActive: false,
      items: [
        { title: "Usuarios", url: "/usuarios", isActive: false },
        { title: "Cursos y Materias", url: "/gestion-cursos-materias", isActive: false },
        { title: "Inscripciones", url: "/inscripciones", isActive: false },
      ],
    },
    {
      title: "IA & Reportes",
      url: "/ia",
      isActive: false,
      items: [
        { title: "Reportes Inteligentes", url: "/reportes", isActive: false },
        { title: "Explicación Boletín", url: "/boletines/explicacion", isActive: false },
      ],
    },
    {
      title: "Configuración",
      url: "/configuracion",
      isActive: false,
      items: [
        { title: "General", url: "/configuracion/general", isActive: false },
        { title: "Bot IA", url: "/configuracion/bot", isActive: false },
      ],
    },
  ],
};

  
  

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useContext(AuthContext)
  const userRole = user?.role || 'alumno'

  // Filtrar elementos del menú según el rol del usuario
  const filteredNavMain = data.navMain.map(group => {
    // Si es el grupo "Gestión", filtrar elementos según el rol
    if (group.title === "Gestión") {
      const filteredItems = group.items.filter(item => {
        // Solo mostrar "Usuarios" si es admin
        if (item.title === "Usuarios") {
          return userRole === 'admin'
        }
        // Mostrar otros elementos según el rol
        if (item.title === "Cursos y Materias") {
          return userRole === 'admin' || userRole === 'docente'
        }
        if (item.title === "Inscripciones") {
          return userRole === 'admin'
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
    
    // Para otros grupos, mostrar todos los elementos
    return group
  }).filter(Boolean) // Remover grupos vacíos

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
                {item.items.map((menuItem) => (
                  <SidebarMenuItem key={menuItem.title}>
                    <SidebarMenuButton asChild isActive={menuItem.isActive}>
                      <a href={menuItem.url}>{menuItem.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
