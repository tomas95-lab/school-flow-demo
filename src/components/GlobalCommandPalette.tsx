import { useEffect, useMemo, useState, Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReutilizableDialog from "@/components/DialogReutlizable";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  CalendarCheck2,
  NotebookText,
  FileText,
  MessagesSquare,
  Bell,
  Users2,
  Layers3,
  BookOpen,
  LineChart,
  Bot,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

type CmdItem = {
  title: string;
  url?: string;
  icon?: any;
  shortcut?: string[];
  onSelect?: () => void;
  group: string;
};

export default function GlobalCommandPalette() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { can, role } = usePermission();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    // Cerrar cuando cambia de ruta
    setOpen(false);
  }, [location.pathname]);

  const items: CmdItem[] = useMemo(() => {
    const base: CmdItem[] = [
      { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard, shortcut: ["G", "D"], group: "Navegación" },
      { title: "Asistencias", url: "/app/asistencias", icon: CalendarCheck2, shortcut: ["G", "A"], group: "Navegación" },
      { title: "Calificaciones", url: "/app/calificaciones", icon: NotebookText, shortcut: ["G", "C"], group: "Navegación" },
      { title: "Boletines", url: "/app/boletines", icon: FileText, shortcut: ["G", "B"], group: "Navegación" },
      { title: "Mensajes", url: "/app/mensajes", icon: MessagesSquare, shortcut: ["G", "M"], group: "Navegación" },
      { title: "Alertas", url: "/app/alertas", icon: Bell, shortcut: ["G", "L"], group: "Navegación" },
      { title: "Inscripciones", url: "/app/inscripciones", icon: BookOpen, shortcut: ["G", "I"], group: "Navegación" },
      { title: "Reportes Inteligentes", url: "/app/reportes", icon: LineChart, shortcut: ["G", "R"], group: "Navegación" },
      { title: "Explicación Boletín", url: "/app/explicacion-boletin", icon: FileText, shortcut: ["G", "E"], group: "Navegación" },
      { title: "Bot IA", url: "/app/bot", icon: Bot, shortcut: ["G", "T"], group: "Navegación" },
      // Acciones rápidas
      {
        title: "Crear Alerta",
        group: "Acciones rápidas",
        onSelect: () => navigate('/app/alertas'),
      },
      {
        title: "Importar Alumnos",
        group: "Acciones rápidas",
        onSelect: () => navigate('/app/usuarios'),
      },
      {
        title: "Exportar tabla (abrir diálogo)",
        group: "Acciones rápidas",
        onSelect: () => {
          window.dispatchEvent(new CustomEvent('datatable:open-export'))
        }
      },
      {
        title: "Exportar tabla CSV",
        group: "Acciones rápidas",
        onSelect: () => {
          window.dispatchEvent(new CustomEvent('datatable:export', { detail: { format: 'csv' } }))
        }
      },
      {
        title: "Exportar tabla XLSX",
        group: "Acciones rápidas",
        onSelect: () => {
          window.dispatchEvent(new CustomEvent('datatable:export', { detail: { format: 'xlsx' } }))
        }
      },
      {
        title: "Exportar tabla PDF",
        group: "Acciones rápidas",
        onSelect: () => {
          window.dispatchEvent(new CustomEvent('datatable:export', { detail: { format: 'pdf' } }))
        }
      },
      {
        title: "Documentación: Manual de Usuario",
        icon: HelpCircle,
        group: "Ayuda",
        onSelect: () => {
          window.open("/docs/USER_MANUAL.md", "_blank", "noopener,noreferrer");
        },
      },
      {
        title: "Sitio del proyecto (README)",
        icon: ExternalLink,
        group: "Ayuda",
        onSelect: () => {
          window.open("/README.md", "_blank", "noopener,noreferrer");
        },
      },
    ]

    // Gatear entradas por permisos/rol
    if (can("canManageUsers" as any)) {
      base.splice(6, 0, { title: "Usuarios", url: "/app/usuarios", icon: Users2, shortcut: ["G", "U"], group: "Navegación" })
    }
    if (can("canManageCourses" as any) || can("canAssignSections" as any)) {
      base.splice(7, 0, { title: "Cursos y Materias", url: "/app/gestion-cursos-materias", icon: Layers3, shortcut: ["G", "Y"], group: "Navegación" })
    }

    return base
  }, [can, role])

  const grouped = useMemo(() => {
    const map: Record<string, CmdItem[]> = {};
    for (const it of items) {
      if (!map[it.group]) map[it.group] = [];
      map[it.group].push(it);
    }
    return map;
  }, [items]);

  return (
    <ReutilizableDialog
      open={open}
      onOpenChange={setOpen}
      small={false}
      title={
        <span>
          Command Palette
        </span>
      }
      description={"Atajos: Ctrl/Cmd+K"}
      content={
        <Command>
          <CommandInput placeholder="Buscar acciones o secciones..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            {Object.entries(grouped).map(([group, list]) => (
              <Fragment key={group}>
                <CommandGroup heading={group}>
                  {list.map((it) => {
                    const Icon = it.icon;
                    return (
                      <CommandItem
                        key={it.title}
                        onSelect={() => {
                          if (it.onSelect) it.onSelect();
                          if (it.url) navigate(it.url);
                          setOpen(false);
                        }}
                      >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        <span>{it.title}</span>
                        {it.shortcut && (
                          <CommandShortcut>{it.shortcut.join(" ")}</CommandShortcut>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </Fragment>
            ))}
          </CommandList>
        </Command>
      }
    />
  );
}


