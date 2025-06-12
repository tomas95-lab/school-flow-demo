type Student = {
  nombre: string
  apellido: string
  email: string
  cursoId: string
}

type Subject = {
  nombre: string
  cursoId: string
  profesor: string
}

type Course = {
  firestoreId: string
  nombre: string
}

type CourseFullData = {
  courseId: string
  courseName: string
  subjects: {
    nombre: string
    profesor: string
  }[]
  students: {
    nombre: string
    apellido: string
    email: string
  }[]
}

export function buildCourseData(
  courses: Course[],
  students: Student[],
  subjects: Subject[]
): CourseFullData[] {
  return courses.map((course) => ({
    courseId: course.firestoreId,
    courseName: course.nombre,
    subjects: subjects
      .filter((s) => s.cursoId === course.firestoreId)
      .map((s) => ({ nombre: s.nombre, profesor: s.profesor })),
    students: students
      .filter((st) => st.cursoId === course.firestoreId)
      .map((st) => ({
        nombre: st.nombre,
        apellido: st.apellido,
        email: st.email
      }))
  }))
}
