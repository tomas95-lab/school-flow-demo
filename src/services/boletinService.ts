import { db } from '@/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type BoletinOrderStrategy = 'name' | 'gradeAsc' | 'gradeDesc' | 'custom';

export interface BoletinTemplate {
  primaryColorHex: string;
  secondaryColorHex: string;
  logoUrl?: string;
  showAttendance: boolean;
  showComments: boolean;
  paperSize: 'A4' | 'Letter';
  orderStrategy: BoletinOrderStrategy;
  customOrder?: string[]; // nombres de materias en el orden deseado
}

const defaultTemplate: BoletinTemplate = {
  primaryColorHex: '#4B5563', // slate-600
  secondaryColorHex: '#9CA3AF', // gray-400
  showAttendance: true,
  showComments: true,
  paperSize: 'A4',
  orderStrategy: 'name',
};

export async function getBoletinTemplate(): Promise<BoletinTemplate> {
  try {
    const ref = doc(db, 'configuracion', 'boletinTemplate');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<BoletinTemplate>;
      return { ...defaultTemplate, ...data };
    }
  } catch {
    // ignore and use default
  }
  return defaultTemplate;
}

export async function saveBoletinTemplate(template: BoletinTemplate): Promise<void> {
  const ref = doc(db, 'configuracion', 'boletinTemplate');
  await setDoc(ref, template, { merge: true });
}

export function applySubjectsOrder<T extends { nombre: string; promedio?: number; t1?: number; t2?: number; t3?: number; T1?: number; T2?: number; T3?: number }>(
  materias: T[],
  template: BoletinTemplate
): T[] {
  const list = [...(materias || [])];
  switch (template.orderStrategy) {
    case 'gradeAsc':
      return list.sort((a, b) => (promedioDe(a) - promedioDe(b)));
    case 'gradeDesc':
      return list.sort((a, b) => (promedioDe(b) - promedioDe(a)));
    case 'custom':
      if (template.customOrder && template.customOrder.length) {
        const indexOf = new Map(template.customOrder.map((n, i) => [n, i] as const));
        return list.sort((a, b) => (indexOf.get(a.nombre) ?? 9999) - (indexOf.get(b.nombre) ?? 9999));
      }
      return list;
    case 'name':
    default:
      return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
}

function promedioDe(m: { promedio?: number; t1?: number; t2?: number; t3?: number; T1?: number; T2?: number; T3?: number }): number {
  if (typeof m.promedio === 'number' && Number.isFinite(m.promedio)) return m.promedio;
  const t1 = m.t1 ?? m.T1 ?? 0;
  const t2 = m.t2 ?? m.T2 ?? 0;
  const t3 = m.t3 ?? m.T3 ?? 0;
  return (t1 + t2 + t3) / 3;
}


