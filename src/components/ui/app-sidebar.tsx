import * as React from "react"

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
        { title: "Cursos y Materias", url: "/cursos", isActive: false },
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
  return (
    <Sidebar {...props}>
      <SidebarHeader>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
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
