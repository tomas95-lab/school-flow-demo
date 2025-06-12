import { DataTable } from "@/app/asistencias/data-table"
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection"
import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"


import { SchoolSpinner } from "./SchoolSpinner"

export default function DetalleAsistencia() {
  
  const [searchParams] = useSearchParams()
  const [id] = useState(searchParams.get("id"))
  const { data: courses } = useFirestoreCollection("courses")
  const { data: students } = useFirestoreCollection("students")
  const { data: subjects } = useFirestoreCollection("subjects")
  const { data: asistencias } = useFirestoreCollection("attendances")

  const course = courses.find((c) => c.firestoreId === id)
  const studentsInCourse = students.filter((s) => s.cursoId === id)
  const subjectsInCourse = subjects.filter((s) => s.cursoId === id)


  if (!course) {
    return (
      <div className="flex items-center justify-center h-screen ">
        <SchoolSpinner text="Cargando Asistencias..." />
      </div>
    );
  }


  console.log(course.firestoreId)

  // Define columns for the data shape used in dataPorMateria
  const columnsDetalle: ColumnDef<{
    id: string | undefined;
    Nombre: string;
    presente: any;
    fecha: any;
  }>[] = [
    {
      accessorKey: "Nombre",
      header: "Nombre",
    },
    {
      accessorKey: "presente",
      header: "Presente",
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">{course.nombre}</h1>
      <h2 className="text-xl font-semibold mb-4">Asistencia por materia</h2>

      {subjectsInCourse.map((subject) => {
        const dataPorMateria = studentsInCourse.map((student) => {
          const asistencia = asistencias.find(
            (a) =>
              a.studentId === student.firestoreId &&
              a.courseId === course.firestoreId &&
              a.subject === subject.nombre
          )
          return {
            id: student.firestoreId,
            Nombre: `${student.nombre} ${student.apellido}`,
            presente: asistencia?.presente ?? false,
            fecha: asistencia?.fecha ?? new Date().toISOString(),
          }
        })

        return (
          <div key={subject.firestoreId}>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">
              {subject.nombre}
            </h3>
            <DataTable columns={columnsDetalle} data={dataPorMateria} />
          </div>
        )
      })}
    </div>
  )
}
