import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash2, Users, GraduationCap, Eye, BookOpen } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export type Curso = {
  id: string
  name: string
  teacherId: string[]
  division: string
}

export type Materia = {
  id: string
  name: string
  teacherId: string[]
  cursoIds: string[]
}

export type MateriaCurso = {
  id: string
  materiaId: string
  materiaName: string
  cursoId: string
  cursoName: string
  teacherId: string[]
}

export const useColumnsCursos = (onEditCurso?: (curso: Curso) => void, onDeleteCurso?: (curso: Curso) => void, onViewCurso?: (curso: Curso) => void): ColumnDef<Curso>[] => [
  {
    accessorKey: "name",
    header: "Curso",
    cell: ({ row }) => {
      const curso = row.original
      const firstLetter = curso.name?.charAt(0)?.toUpperCase() || "U"
      const displayName = curso.name || "Sin nombre"
      
      return (
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
            <span className="text-sm font-medium text-slate-700">
              {firstLetter}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-slate-900">
              {displayName}
            </div>
            <div className="text-xs text-slate-500">
              ID: {curso.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "division",
    header: "División",
    cell: ({ row }) => {
      const division = row.getValue("division") as string
      return (
        <Badge variant="outline" className="bg-white text-slate-700 border-slate-300">
          {division}
        </Badge>
      )
    },
  },
  {
    accessorKey: "teacherId",
    header: "Docentes",
    cell: ({ row }) => {
      const teacherId = row.getValue("teacherId") as string[]
      
      if (!teacherId || teacherId.length === 0) {
        return (
          <div className="flex items-center text-slate-400">
            <Users className="h-4 w-4 mr-2" />
            <span className="text-sm">Sin asignar</span>
          </div>
        )
      }

      return (
        <div className="space-y-1">
          {teacherId.slice(0, 2).map((teacher) => (
            <div key={teacher} className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-slate-600">
                  {teacher.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-slate-700">{teacher}</span>
            </div>
          ))}
          {teacherId.length > 2 && (
            <span className="text-xs text-slate-500">
              +{teacherId.length - 2} más
            </span>
          )}
        </div>
      )
    },
    filterFn: (row, id, filterValue) => {
      if (filterValue === "all" || !filterValue) return true;
      const teachers = row.getValue(id) as string[];
      return teachers.some(teacher => 
        teacher.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const curso = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onViewCurso?.(curso)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onEditCurso?.(curso)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 cursor-pointer"
              onClick={() => onDeleteCurso?.(curso)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Columnas para mostrar materias (vista general)
export const useColumnsMaterias = (onEditMateria?: (materia: Materia) => void, onDeleteMateria?: (materia: Materia) => void, onViewMateria?: (materia: Materia) => void): ColumnDef<Materia>[] => [
  {
    accessorKey: "name",
    header: "Materia",
    cell: ({ row }) => {
      const materia = row.original
      const displayName = materia.name || "Sin nombre"
      
      return (
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
            <BookOpen className="h-4 w-4 text-slate-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-slate-900">
              {displayName}
            </div>
            <div className="text-xs text-slate-500">
              ID: {materia.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "cursoIds",
    header: "Cursos donde se imparte",
    cell: ({ row }) => {
      const cursoIds = row.getValue("cursoIds") as string[]
      console
      if (!cursoIds || cursoIds.length === 0) {
        return (
          <div className="flex items-center text-slate-400">
            <GraduationCap className="h-4 w-4 mr-2" />
            <span className="text-sm">Sin asignar</span>
          </div>
        )
      }

      return (
        <div className="flex flex-wrap gap-1">
          {cursoIds.slice(0, 3).map((cursoId) => (
            <Badge key={cursoId} variant="secondary" className="text-xs">
              {cursoId}
            </Badge>
          ))}
          {cursoIds.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{cursoIds.length - 3} más
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "teacherId",
    header: "Docentes",
    cell: ({ row }) => {
      const teacherId = row.getValue("teacherId") as string[]
      
      if (!teacherId || teacherId.length === 0) {
        return (
          <div className="flex items-center text-slate-400">
            <Users className="h-4 w-4 mr-2" />
            <span className="text-sm">Sin asignar</span>
          </div>
        )
      }

      return (
        <div className="space-y-1">
          {teacherId.slice(0, 2).map((teacher) => (
            <div key={teacher} className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-slate-600">
                  {teacher.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-slate-700">{teacher}</span>
            </div>
          ))}
          {teacherId.length > 2 && (
            <span className="text-xs text-slate-500">
              +{teacherId.length - 2} más
            </span>
          )}
        </div>
      )
    },
    filterFn: (row, id, filterValue) => {
      if (filterValue === "all" || !filterValue) return true;
      const teachers = row.getValue(id) as string[];
      return teachers.some(teacher => 
        teacher.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const materia = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onViewMateria?.(materia)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onEditMateria?.(materia)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 cursor-pointer"
              onClick={() => onDeleteMateria?.(materia)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Nuevas columnas para mostrar la relación materia-curso específica
export const useColumnsMateriaCurso = (onEditMateriaCurso?: (materiaCurso: MateriaCurso) => void, onDeleteMateriaCurso?: (materiaCurso: MateriaCurso) => void, onViewMateriaCurso?: (materiaCurso: MateriaCurso) => void): ColumnDef<MateriaCurso>[] => [
  {
    accessorKey: "materiaName",
    header: "Materia",
    cell: ({ row }) => {
      const materiaCurso = row.original
      const displayName = materiaCurso.materiaName || "Sin nombre"
      
      return (
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
            <BookOpen className="h-4 w-4 text-slate-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-slate-900">
              {displayName}
            </div>
            <div className="text-xs text-slate-500">
              ID: {materiaCurso.materiaId.slice(0, 8)}...
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "cursoName",
    header: "Curso",
    cell: ({ row }) => {
      const cursoName = row.getValue("cursoName") as string
      return (
        <Badge variant="outline" className="bg-white text-slate-700 border-slate-300">
          {cursoName}
        </Badge>
      )
    },
  },
  {
    accessorKey: "teacherId",
    header: "Docentes",
    cell: ({ row }) => {
      const teacherId = row.getValue("teacherId") as string[]
      
      if (!teacherId || teacherId.length === 0) {
        return (
          <div className="flex items-center text-slate-400">
            <Users className="h-4 w-4 mr-2" />
            <span className="text-sm">Sin asignar</span>
          </div>
        )
      }

      return (
        <div className="space-y-1">
          {teacherId.slice(0, 2).map((teacher) => (
            <div key={teacher} className="flex items-center">
              <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center mr-2">
                <span className="text-xs font-medium text-slate-600">
                  {teacher.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-slate-700">{teacher}</span>
            </div>
          ))}
          {teacherId.length > 2 && (
            <span className="text-xs text-slate-500">
              +{teacherId.length - 2} más
            </span>
          )}
        </div>
      )
    },
    filterFn: (row, id, filterValue) => {
      if (filterValue === "all" || !filterValue) return true;
      const teachers = row.getValue(id) as string[];
      return teachers.some(teacher => 
        teacher.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const materiaCurso = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onViewMateriaCurso?.(materiaCurso)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onEditMateriaCurso?.(materiaCurso)}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 cursor-pointer"
              onClick={() => onDeleteMateriaCurso?.(materiaCurso)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 
