import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { db } from "@/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default function AttendanceThresholdsCard() {
  const [critica, setCritica] = useState<string>("");
  const [baja, setBaja] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, 'configuracion', 'umbralesIA');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d: any = snap.data();
          if (typeof d?.asistenciaCritica === 'number') setCritica(String(d.asistenciaCritica));
          if (typeof d?.asistenciaBaja === 'number') setBaja(String(d.asistenciaBaja));
        } else {
          setCritica('70');
          setBaja('80');
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const save = async () => {
    const c = Number(critica);
    const b = Number(baja);
    if (isNaN(c) || isNaN(b)) {
      toast.error('Valores inválidos');
      return;
    }
    if (c <= 0 || c >= 100 || b <= 0 || b >= 100) {
      toast.error('Los umbrales deben ser porcentajes entre 1 y 99');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'configuracion', 'umbralesIA');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, { asistenciaCritica: c, asistenciaBaja: b, updatedAt: new Date() });
      } else {
        await setDoc(ref, { asistenciaCritica: c, asistenciaBaja: b, createdAt: new Date() });
      }
      toast.success('Umbrales de asistencia actualizados');
    } catch {
      toast.error('No se pudieron guardar los umbrales');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Alertas de asistencia</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-700">Asistencia crítica (%)</label>
            <Input value={critica} onChange={(e) => setCritica(e.target.value)} placeholder="70" />
          </div>
          <div>
            <label className="text-xs text-gray-700">Asistencia baja (%)</label>
            <Input value={baja} onChange={(e) => setBaja(e.target.value)} placeholder="80" />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="w-full">{saving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


