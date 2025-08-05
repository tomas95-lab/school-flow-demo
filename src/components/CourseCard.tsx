import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ChevronRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

// Tipos TypeScript
export interface Course {
  nombre: string;
  division: string;
  firestoreId: string;
}

interface CourseCardProps {
  course: Course;
  link: string;
  descripcion: string;
  className?: string;
}

export function CourseCard({ course, link, descripcion, className = "" }: CourseCardProps) {
  return (
    <Link
      to={`/app${link}`}
      className={`group block transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer ${className}`}
      style={{
        animationDelay: `${100}ms`,
        animation: 'slideInUp 0.6s ease-out forwards'
      }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-blue-50/50">
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform rotate-12 translate-x-8 -translate-y-8">
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full"></div>
        </div>
        
        <CardContent className="p-6 relative">
          {/* Course Icon */}
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors duration-300">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
          </div>

          {/* Course Info */}
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors duration-300 line-clamp-2">
              {course.nombre} - {course.division}
            </CardTitle>
            <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
              {descripcion}
            </p>
          </div>
        </CardContent>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 rounded-lg transition-colors duration-300"></div>
      </Card>
    </Link>
  );
}
