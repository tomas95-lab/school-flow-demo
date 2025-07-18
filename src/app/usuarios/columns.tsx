import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type User = {
  id: string
  name: string
  email: string
  role: "admin" | "docente" | "alumno"
  status: "active" | "inactive"
  lastLogin?: string
  createdAt?: string
}

export const useColumnsUsuarios = (onEditUser?: (user: User) => void, onDeleteUser?: (user: User) => void): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.name || "Sin nombre"}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      const roleConfig = {
        admin: { label: "Administrador", color: "bg-red-100 text-red-800" },
        docente: { label: "Docente", color: "bg-purple-100 text-purple-800" },
        alumno: { label: "Estudiante", color: "bg-green-100 text-green-800" },
      }
      
      const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.alumno
      
      return (
        <Badge className={config.color}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, filterValue) => {
      if (filterValue === "all" || !filterValue) return true;
      return row.getValue(id) === filterValue;
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant={status === "active" ? "default" : "secondary"}
          className={status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
        >
          {status === "active" ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
    filterFn: (row, id, filterValue) => {
      if (filterValue === "all" || !filterValue) return true;
      return row.getValue(id) === filterValue;
    },
  },
  {
    accessorKey: "lastLogin",
    header: "Último Acceso",
    cell: ({ row }) => {
      const lastLogin = row.getValue("lastLogin") as string
      return (
        <div className="text-sm">
          {lastLogin ? (
            <div>
              <div className="text-gray-900 font-medium">
                {new Date(lastLogin).toLocaleDateString('es-ES')}
              </div>
              <div className="text-gray-500 text-xs">
                {new Date(lastLogin).toLocaleTimeString('es-ES', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ) : (
            <span className="text-gray-400 italic">Nunca</span>
          )}
        </div>
      )
    },
    filterFn: (row, id, filterValue) => {
      const lastLogin = row.getValue(id) as string;
      if (!lastLogin || !filterValue) return true;
      
      const loginDate = new Date(lastLogin);
      const filterDate = new Date(filterValue);
      
      // Verificar si el login fue hoy
      return loginDate >= filterDate && loginDate < new Date(filterDate.getTime() + 24 * 60 * 60 * 1000);
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const user = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEditUser?.(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar usuario
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDeleteUser?.(user)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar usuario
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 
