import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { Printer } from "lucide-react";

type Schedule = {
  firestoreId: string;
  subjectId: string;
  courseId: string;
  dayOfWeek: number; // 1-7 Lunes-Domingo
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  room?: string;
};

type Subject = { firestoreId: string; nombre: string };

const dayLabels: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

export default function CourseWeeklyCalendar({ courseId }: { courseId: string }) {
  const { data: schedulesRaw } = useFirestoreCollection<Schedule>('schedules', {
    constraints: courseId ? [{ field: 'courseId', op: '==', value: courseId }] as any : [],
    enableCache: true,
    dependencies: [courseId]
  } as any);
  const { data: subjects } = useFirestoreCollection<Subject>('subjects');

  const subjectsMap = useMemo(() => {
    const m = new Map<string, string>();
    (subjects || []).forEach(s => m.set(s.firestoreId, s.nombre));
    return m;
  }, [subjects]);

  const schedulesByDay = useMemo(() => {
    const by: Record<number, Schedule[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    (schedulesRaw || [])
      .filter(s => s.courseId === courseId)
      .forEach(s => { if (by[s.dayOfWeek]) by[s.dayOfWeek].push(s); });
    Object.values(by).forEach(list => list.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return by;
  }, [schedulesRaw, courseId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendario Semanal</CardTitle>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(schedulesByDay).map(([day, items]) => (
            <div key={day} className="border rounded-lg p-3 bg-gray-50">
              <div className="font-semibold text-gray-900 mb-2">{dayLabels[Number(day)]}</div>
              {items.length === 0 ? (
                <div className="text-sm text-gray-500">Sin clases</div>
              ) : (
                <div className="space-y-2">
                  {items.map((it) => (
                    <div key={it.firestoreId} className="p-2 bg-white border rounded-md">
                      <div className="text-sm font-medium text-gray-900">
                        {subjectsMap.get(it.subjectId) || 'Materia'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {it.startTime} - {it.endTime}{it.room ? ` • Aula ${it.room}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


