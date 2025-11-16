import { useState, useEffect } from 'react';
import { getDemoKPIs, isDemoMode } from '@/data/demoData';

export function useDemoKPIs() {
  const [kpis, setKpis] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    averageGrade: 0,
    attendanceRate: 0,
    activeAlerts: 0,
    totalGrades: 0,
    totalAttendances: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      if (!isDemoMode()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Simular delay de carga
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const demoKPIs = getDemoKPIs();
      setKpis(demoKPIs);
      setLoading(false);
    };

    fetchKPIs();
  }, []);

  return { kpis, loading };
}
