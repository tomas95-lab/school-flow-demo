import { useEffect, useState } from "react";
import ReutilizableDialog from "./DialogReutlizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/firebaseConfig";
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { toast } from "sonner";

type Schedule = {
  firestoreId?: string;
  subjectId: string;
  courseId: string;
  dayOfWeek: number; // 1-7 (Lunes=1)
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  room?: string;
  createdAt?: any;
};

const days: { value: number; label: string }[] = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export default function SubjectScheduleModal({ subject, courseId, open, onOpenChange }: { subject: any; courseId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [existing, setExisting] = useState<Schedule[]>([]);
  const [day, setDay] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>("08:00");
  const [endTime, setEndTime] = useState<string>("09:00");
  const [room, setRoom] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!open || !subject?.firestoreId) return;
      try {
        const qy = query(collection(db, 'schedules'), where('subjectId', '==', subject.firestoreId));
        const snap = await getDocs(qy as any);
        const items: Schedule[] = [];
        snap.forEach((d: any) => items.push({ firestoreId: d.id, ...(d.data() || {}) }));
        setExisting(items.sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime)));
      } catch {
        setExisting([]);
      }
    };
    load();
  }, [open, subject?.firestoreId]);

  const addSchedule = async () => {
    if (!subject?.firestoreId || !courseId) return;
    if (!startTime || !endTime) {
      toast.error('Completa hora inicio y fin');
      return;
    }
    setSaving(true);
    try {
      const payload: Schedule = {
        subjectId: subject.firestoreId,
        courseId,
        dayOfWeek: day,
        startTime,
        endTime,
        room: room || undefined,
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'schedules'), payload);
      setExisting(prev => [...prev, { ...payload, firestoreId: ref.id }].sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime)));
      toast.success('Horario agregado');
    } catch {
      toast.error('No se pudo agregar el horario');
    } finally {
      setSaving(false);
    }
  };

  const removeSchedule = async (id?: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'schedules', id));
      setExisting(prev => prev.filter(s => s.firestoreId !== id));
      toast.success('Horario eliminado');
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  return (
    <ReutilizableDialog
      triger={undefined}
      title={`Horarios • ${subject?.nombre || 'Materia'}`}
      description="Configura los días, horarios y aulas de esta materia."
      content={(
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-sm">Día</Label>
              <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map(d => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Inicio</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm">Fin</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm">Aula</Label>
              <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Ej: 101" />
            </div>
          </div>
          <div>
            <Button onClick={addSchedule} disabled={saving}>{saving ? 'Guardando...' : 'Agregar horario'}</Button>
          </div>
          <div className="space-y-2">
            {existing.length === 0 ? (
              <div className="text-sm text-gray-500">Sin horarios aún</div>
            ) : (
              existing.map((s) => (
                <div key={s.firestoreId} className="p-2 border rounded flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{days.find(d => d.value === s.dayOfWeek)?.label}</span>{' '}
                    {s.startTime}–{s.endTime}{s.room ? ` • Aula ${s.room}` : ''}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => removeSchedule(s.firestoreId)}>Eliminar</Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      footer={(<div className="flex justify-end"><Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button></div>)}
      open={open}
      onOpenChange={onOpenChange}
      small={true}
    />
  );
}


