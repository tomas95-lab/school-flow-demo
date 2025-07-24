import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";

export const useTables = () => {
    const { data: courses } =  useFirestoreCollection("courses");
    const { data: subjects } =  useFirestoreCollection("subjects");
    const { data: teachers } = useFirestoreCollection("teachers");
    const { data: students } = useFirestoreCollection("students");
    
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
