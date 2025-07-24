import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";

export const useTables = () => {
    const { loading: coursesLoading, data: courses } =  useFirestoreCollection("courses");
    const { loading: subjectsLoading, data: subjects } =  useFirestoreCollection("subjects");
    const { loading: teachersLoading, data: teachers } = useFirestoreCollection("teachers");
    const { loading: studentsLoading, data: students } = useFirestoreCollection("students");
    
    console.log(courses[0])
    console.log(subjects[0])
    console.log(teachers[0])
    console.log(students[0])
    return {
        courses: courses,
        subjects: subjects,
        teachers: teachers,
        students: students,
    }
}



useTables()
