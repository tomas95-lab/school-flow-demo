import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useFirestoreCollection } from '@/hooks/useFireStoreCollection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bot, 
  X, 
  Send,
  TrendingUp,
  AlertTriangle,
  Users,
  BarChart3,
  Zap,
  Minimize2,
  Maximize2,
  Trash2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BotMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  color: string;
}

const FloatingBot: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch data for intelligent responses
  const { data: students } = useFirestoreCollection('students');
  const { data: courses } = useFirestoreCollection('courses');
  const { data: teachers } = useFirestoreCollection('users');
  const { data: subjects } = useFirestoreCollection('subjects');
  const { data: attendances } = useFirestoreCollection('attendances');
  const { data: calificaciones } = useFirestoreCollection('calificaciones');
  const { data: boletines } = useFirestoreCollection('boletines');
  const { data: alerts } = useFirestoreCollection('alerts');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  // Initialize bot with welcome message
  useEffect(() => {
    if (messages.length === 0 && user?.email && isOpen) {
      addBotMessage(
        `¡Hola ${user.email.split('@')[0]}! Soy tu asistente IA. 🤖

¿En qué puedo ayudarte hoy?`,
        [
          '📊 Analizar rendimiento académico',
          '📈 Ver estadísticas de asistencia',
          '⚠️ Identificar estudiantes en riesgo',
          '📋 Consultar datos del sistema'
        ]
      );
    }
  }, [user?.email, isOpen, messages.length]);

  const addBotMessage = (content: string, suggestions?: string[]) => {
    const message: BotMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      suggestions
    };
    setMessages(prev => [...prev, message]);
    setMessageCount(prev => prev + 1);
  };

  const addUserMessage = (content: string) => {
    const message: BotMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    setMessageCount(prev => prev + 1);
  };

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'performance',
      title: 'Rendimiento',
      description: 'Analizar calificaciones',
      icon: TrendingUp,
      action: () => handleQuickAction('Analizar rendimiento académico'),
      color: 'bg-green-500'
    },
    {
      id: 'attendance',
      title: 'Asistencia',
      description: 'Ver estadísticas',
      icon: Users,
      action: () => handleQuickAction('Ver estadísticas de asistencia'),
      color: 'bg-blue-500'
    },
    {
      id: 'risk',
      title: 'Riesgo',
      description: 'Identificar problemas',
      icon: AlertTriangle,
      action: () => handleQuickAction('Identificar estudiantes en riesgo'),
      color: 'bg-red-500'
    },
    {
      id: 'stats',
      title: 'Estadísticas',
      description: 'Datos del sistema',
      icon: BarChart3,
      action: () => handleQuickAction('Mostrar estadísticas del sistema'),
      color: 'bg-purple-500'
    }
  ];

  const handleQuickAction = async (action: string) => {
    if (!isOpen) return;
    
    addUserMessage(action);
    setShowQuickActions(false);
    setIsTyping(true);
    const response = await generateBotResponse(action);
    addBotMessage(response);
    setIsTyping(false);
  };

  // Intelligent response generation with advanced logic
  const generateBotResponse = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase();
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));

    // Advanced context detection with multiple keywords
    const context = analyzeContext(input);
    
    // Generate response based on context
    switch (context.type) {
      case 'academic_performance':
        return generateAdvancedAcademicAnalysis(context.details);
      case 'attendance':
        return generateAdvancedAttendanceAnalysis(context.details);
      case 'risk_assessment':
        return generateAdvancedRiskAnalysis(context.details);
      case 'system_stats':
        return generateAdvancedSystemStats(context.details);
      case 'user_management':
        return generateAdvancedUserInfo(context.details);
      case 'student_info':
        return generateAdvancedStudentInfo(context.details);
      case 'teacher_info':
        return generateAdvancedTeacherInfo(context.details);
      case 'course_info':
        return generateAdvancedCourseInfo(context.details);
      case 'subject_info':
        return generateAdvancedSubjectInfo(context.details);
      case 'boletin_info':
        return generateAdvancedBoletinInfo(context.details);
      case 'alert_info':
        return generateAdvancedAlertInfo(context.details);
      case 'comparison':
        return generateComparisonAnalysis(context.details);
      case 'prediction':
        return generatePredictionAnalysis(context.details);
      case 'recommendation':
        return generateRecommendationAnalysis(context.details);
      case 'help':
        return generateAdvancedHelpResponse(context.details);
      case 'greeting':
        return generateAdvancedGreeting(context.details);
      default:
        return generateIntelligentGeneralResponse(input, context);
    }
  };

  // Advanced context analysis
  const analyzeContext = (input: string) => {
    const context: any = {
      type: 'general',
      details: {},
      keywords: [] as string[],
      intent: 'query',
      urgency: 'normal',
      complexity: 'basic'
    };

    // Extract keywords and determine intent
    const keywords = input.split(' ').filter(word => word.length > 2);
    context.keywords = keywords as string[];

    // Detect urgency
    if (input.includes('urgente') || input.includes('crítico') || input.includes('inmediato')) {
      context.urgency = 'high';
    }

    // Detect complexity
    if (input.includes('detallado') || input.includes('completo') || input.includes('análisis profundo')) {
      context.complexity = 'advanced';
    }

    // Advanced pattern matching
    if (input.includes('rendimiento') || input.includes('notas') || input.includes('calificaciones') || 
        input.includes('promedio') || input.includes('excelente') || input.includes('bajo')) {
      context.type = 'academic_performance';
      context.details = {
        focus: input.includes('promedio') ? 'average' : 
               input.includes('excelente') ? 'high_performers' :
               input.includes('bajo') ? 'low_performers' : 'general',
        period: input.includes('trimestre') ? 'quarter' : 
                input.includes('semestre') ? 'semester' : 'all',
        comparison: input.includes('comparar') || input.includes('vs') || input.includes('entre')
      };
    } else if (input.includes('asistencia') || input.includes('ausencia') || input.includes('presente') || 
               input.includes('falta') || input.includes('tardanza')) {
      context.type = 'attendance';
      context.details = {
        focus: input.includes('tardanza') ? 'late' : 
               input.includes('falta') ? 'absent' : 'general',
        period: input.includes('semana') ? 'week' : 
                input.includes('mes') ? 'month' : 'all',
        trend: input.includes('tendencia') || input.includes('evolución')
      };
    } else if (input.includes('riesgo') || input.includes('problema') || input.includes('alerta') || 
               input.includes('crítico') || input.includes('urgente')) {
      context.type = 'risk_assessment';
      context.details = {
        level: input.includes('crítico') ? 'critical' : 
               input.includes('alto') ? 'high' : 'general',
        type: input.includes('académico') ? 'academic' : 
              input.includes('asistencia') ? 'attendance' : 'combined'
      };
    } else if (input.includes('usuario') || input.includes('usuarios') || input.includes('crear') || 
               input.includes('agregar') || input.includes('nuevo')) {
      context.type = 'user_management';
      context.details = {
        action: input.includes('crear') || input.includes('agregar') ? 'create' : 'info',
        role: input.includes('admin') ? 'admin' : 
              input.includes('profesor') ? 'teacher' : 'general'
      };
    } else if (input.includes('estudiante') || input.includes('estudiantes') || input.includes('alumno')) {
      context.type = 'student_info';
      context.details = {
        focus: input.includes('mejor') ? 'top' : 
               input.includes('peor') ? 'bottom' : 'general',
        course: extractCourseFromInput(input),
        grade: extractGradeFromInput(input)
      };
    } else if (input.includes('profesor') || input.includes('profesores') || input.includes('docente')) {
      context.type = 'teacher_info';
      context.details = {
        focus: input.includes('mejor') ? 'top' : 'general',
        subject: extractSubjectFromInput(input)
      };
    } else if (input.includes('curso') || input.includes('cursos') || input.includes('grado')) {
      context.type = 'course_info';
      context.details = {
        course: extractCourseFromInput(input),
        comparison: input.includes('comparar') || input.includes('vs')
      };
    } else if (input.includes('materia') || input.includes('materias') || input.includes('asignatura')) {
      context.type = 'subject_info';
      context.details = {
        subject: extractSubjectFromInput(input),
        performance: input.includes('rendimiento') || input.includes('promedio')
      };
    } else if (input.includes('boletín') || input.includes('boletines') || input.includes('reporte')) {
      context.type = 'boletin_info';
      context.details = {
        action: input.includes('generar') ? 'generate' : 'info',
        period: extractPeriodFromInput(input)
      };
    } else if (input.includes('alerta') || input.includes('alertas') || input.includes('notificación')) {
      context.type = 'alert_info';
      context.details = {
        type: input.includes('crítica') ? 'critical' : 'general',
        status: input.includes('activa') ? 'active' : 'all'
      };
    } else if (input.includes('comparar') || input.includes('vs') || input.includes('entre') || 
               input.includes('diferencias')) {
      context.type = 'comparison';
      context.details = {
        entities: extractComparisonEntities(input),
        metric: extractMetricFromInput(input)
      };
    } else if (input.includes('predicción') || input.includes('futuro') || input.includes('tendencia') || 
               input.includes('proyección')) {
      context.type = 'prediction';
      context.details = {
        timeframe: extractTimeframeFromInput(input),
        metric: extractMetricFromInput(input)
      };
    } else if (input.includes('recomendación') || input.includes('sugerencia') || input.includes('mejorar') || 
               input.includes('optimizar')) {
      context.type = 'recommendation';
      context.details = {
        area: extractAreaFromInput(input),
        priority: input.includes('urgente') ? 'high' : 'normal'
      };
    } else if (input.includes('ayuda') || input.includes('comandos') || input.includes('funciones')) {
      context.type = 'help';
      context.details = {
        category: extractHelpCategory(input)
      };
    } else if (input.includes('hola') || input.includes('buenos días') || input.includes('buenas')) {
      context.type = 'greeting';
      context.details = {
        time: new Date().getHours(),
        user: user?.email?.split('@')[0]
      };
    }

    return context;
  };

  // Helper functions for context analysis
  const extractCourseFromInput = (input: string): string | null => {
    const coursePatterns = ['primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'séptimo', 'octavo', 'noveno', 'décimo'];
    for (const pattern of coursePatterns) {
      if (input.includes(pattern)) return pattern;
    }
    return null;
  };

  const extractSubjectFromInput = (input: string): string | null => {
    const subjectPatterns = ['matemáticas', 'matematica', 'español', 'ciencias', 'historia', 'geografía', 'inglés', 'ingles', 'arte', 'física', 'fisica', 'química', 'quimica'];
    for (const pattern of subjectPatterns) {
      if (input.includes(pattern)) return pattern;
    }
    return null;
  };

  const extractGradeFromInput = (input: string): number | null => {
    const gradeMatch = input.match(/(\d+(?:\.\d+)?)/);
    return gradeMatch ? parseFloat(gradeMatch[1]) : null;
  };

  const extractPeriodFromInput = (input: string): string => {
    if (input.includes('trimestre')) return 'quarter';
    if (input.includes('semestre')) return 'semester';
    if (input.includes('mes')) return 'month';
    return 'all';
  };

  const extractComparisonEntities = (input: string): string[] => {
    const entities: string[] = [];
    if (input.includes('curso')) entities.push('courses');
    if (input.includes('materia')) entities.push('subjects');
    if (input.includes('estudiante')) entities.push('students');
    if (input.includes('profesor')) entities.push('teachers');
    return entities;
  };

  const extractMetricFromInput = (input: string): string => {
    if (input.includes('promedio')) return 'average';
    if (input.includes('asistencia')) return 'attendance';
    if (input.includes('rendimiento')) return 'performance';
    return 'general';
  };

  const extractTimeframeFromInput = (input: string): string => {
    if (input.includes('semana')) return 'week';
    if (input.includes('mes')) return 'month';
    if (input.includes('trimestre')) return 'quarter';
    return 'semester';
  };

  const extractAreaFromInput = (input: string): string => {
    if (input.includes('académico')) return 'academic';
    if (input.includes('asistencia')) return 'attendance';
    if (input.includes('sistema')) return 'system';
    return 'general';
  };

  const extractHelpCategory = (input: string): string => {
    if (input.includes('análisis')) return 'analysis';
    if (input.includes('usuario')) return 'users';
    if (input.includes('reporte')) return 'reports';
    return 'general';
  };

  const generateAdvancedAcademicAnalysis = (details: any): string => {
    if (!students || !calificaciones) {
      return '❌ No tengo suficientes datos de estudiantes y calificaciones para realizar el análisis.';
    }

    const totalStudents = students.length;
    const totalGrades = calificaciones.length;
    const averageGrade = calificaciones.reduce((sum, g) => sum + g.valor, 0) / totalGrades;
    
    // Advanced analysis based on context
    let analysis = `📊 **Análisis Avanzado de Rendimiento Académico**\n\n`;
    
    if (details.focus === 'average') {
      analysis += `🎯 **Análisis de Promedios:**\n`;
      analysis += `• Promedio general: **${averageGrade.toFixed(2)}**\n`;
      
      // Calculate median
      const sortedGrades = calificaciones.map(g => g.valor).sort((a, b) => a - b);
      const median = sortedGrades[Math.floor(sortedGrades.length / 2)];
      analysis += `• Mediana: **${median.toFixed(2)}**\n`;
      
      // Calculate standard deviation
      const variance = calificaciones.reduce((sum, g) => sum + Math.pow(g.valor - averageGrade, 2), 0) / totalGrades;
      const stdDev = Math.sqrt(variance);
      analysis += `• Desviación estándar: **${stdDev.toFixed(2)}**\n`;
      
      analysis += `• Rango: **${Math.min(...sortedGrades).toFixed(1)} - ${Math.max(...sortedGrades).toFixed(1)}**\n\n`;
    } else if (details.focus === 'high_performers') {
      const highPerformers = calificaciones.filter(g => g.valor >= 8);
      const topPerformers = calificaciones.filter(g => g.valor >= 9);
      
      analysis += `⭐ **Análisis de Estudiantes Destacados:**\n`;
      analysis += `• Estudiantes con ≥8: **${highPerformers.length}** (${((highPerformers.length / totalGrades) * 100).toFixed(1)}%)\n`;
      analysis += `• Estudiantes con ≥9: **${topPerformers.length}** (${((topPerformers.length / totalGrades) * 100).toFixed(1)}%)\n`;
      analysis += `• Promedio de destacados: **${highPerformers.length > 0 ? (highPerformers.reduce((sum, g) => sum + g.valor, 0) / highPerformers.length).toFixed(2) : 'N/A'}**\n\n`;
    } else if (details.focus === 'low_performers') {
      const lowPerformers = calificaciones.filter(g => g.valor < 6);
      const criticalPerformers = calificaciones.filter(g => g.valor < 4);
      
      analysis += `⚠️ **Análisis de Estudiantes en Riesgo:**\n`;
      analysis += `• Estudiantes con <6: **${lowPerformers.length}** (${((lowPerformers.length / totalGrades) * 100).toFixed(1)}%)\n`;
      analysis += `• Estudiantes críticos (<4): **${criticalPerformers.length}** (${((criticalPerformers.length / totalGrades) * 100).toFixed(1)}%)\n`;
      analysis += `• Promedio de riesgo: **${lowPerformers.length > 0 ? (lowPerformers.reduce((sum, g) => sum + g.valor, 0) / lowPerformers.length).toFixed(2) : 'N/A'}**\n\n`;
    } else {
      // General analysis
    const highPerformers = calificaciones.filter(g => g.valor >= 8).length;
    const lowPerformers = calificaciones.filter(g => g.valor < 6).length;
      const mediumPerformers = totalGrades - highPerformers - lowPerformers;
      
      analysis += `📈 **Análisis General:**\n`;
      analysis += `• Promedio general: **${averageGrade.toFixed(2)}**\n`;
      analysis += `• Estudiantes destacados (≥8): **${highPerformers}** (${((highPerformers / totalGrades) * 100).toFixed(1)}%)\n`;
      analysis += `• Rendimiento medio (6-7.9): **${mediumPerformers}** (${((mediumPerformers / totalGrades) * 100).toFixed(1)}%)\n`;
      analysis += `• Estudiantes en riesgo (<6): **${lowPerformers}** (${((lowPerformers / totalGrades) * 100).toFixed(1)}%)\n`;
      analysis += `• Tasa de aprobación: **${((totalGrades - lowPerformers) / totalGrades * 100).toFixed(1)}%**\n\n`;
    }

    // Add period-specific analysis if requested
    if (details.period !== 'all') {
      analysis += `📅 **Análisis por Período (${details.period}):**\n`;
      analysis += `• Datos específicos del período solicitado\n`;
      analysis += `• Comparación con períodos anteriores\n\n`;
    }

    // Add comparison analysis if requested
    if (details.comparison) {
      analysis += `🔄 **Análisis Comparativo:**\n`;
      analysis += `• Comparación entre diferentes grupos\n`;
      analysis += `• Identificación de tendencias\n`;
      analysis += `• Análisis de variaciones\n\n`;
    }

    analysis += `💡 **Recomendaciones Inteligentes:**\n`;
    if (details.focus === 'low_performers') {
      analysis += `• Implementar tutorías personalizadas\n`;
      analysis += `• Establecer metas específicas por estudiante\n`;
      analysis += `• Crear grupos de apoyo académico\n`;
      analysis += `• Monitoreo semanal de progreso\n`;
    } else if (details.focus === 'high_performers') {
      analysis += `• Crear programas de enriquecimiento\n`;
      analysis += `• Asignar proyectos especiales\n`;
      analysis += `• Reconocimiento y motivación\n`;
      analysis += `• Mentoría para otros estudiantes\n`;
    } else {
      analysis += `• Implementar tutorías para estudiantes con bajo rendimiento\n`;
      analysis += `• Reconocer y motivar a estudiantes destacados\n`;
      analysis += `• Establecer metas personalizadas por estudiante\n`;
      analysis += `• Crear programas de apoyo académico\n`;
      analysis += `• Análisis continuo de tendencias\n`;
    }

    return analysis;
  };

  const generateAdvancedAttendanceAnalysis = (details: any): string => {
    if (!attendances) {
      return '❌ No tengo datos de asistencia disponibles para el análisis.';
    }

    const totalRecords = attendances.length;
    const presentRecords = attendances.filter(a => a.present).length;
    const absentRecords = totalRecords - presentRecords;
    const attendanceRate = (presentRecords / totalRecords) * 100;

    let analysis = `📅 **Análisis Avanzado de Asistencia**\n\n`;

    if (details.focus === 'late') {
      const lateRecords = attendances.filter(a => a.tardanza).length;
      analysis += `⏰ **Análisis de Tardanzas:**\n`;
      analysis += `• Tardanzas registradas: **${lateRecords}**\n`;
      analysis += `• Porcentaje de tardanzas: **${((lateRecords / totalRecords) * 100).toFixed(1)}%**\n`;
      analysis += `• Impacto en rendimiento académico\n\n`;
    } else if (details.focus === 'absent') {
      analysis += `❌ **Análisis de Ausencias:**\n`;
      analysis += `• Ausencias totales: **${absentRecords}**\n`;
      analysis += `• Porcentaje de ausencias: **${((absentRecords / totalRecords) * 100).toFixed(1)}%**\n`;
      analysis += `• Patrones de ausentismo\n\n`;
    } else {
      analysis += `📊 **Análisis General de Asistencia:**\n`;
      analysis += `• Total de registros: **${totalRecords}**\n`;
      analysis += `• Tasa de asistencia: **${attendanceRate.toFixed(1)}%**\n`;
      analysis += `• Presencias: **${presentRecords}** (${((presentRecords / totalRecords) * 100).toFixed(1)}%)\n`;
      analysis += `• Ausencias: **${absentRecords}** (${((absentRecords / totalRecords) * 100).toFixed(1)}%)\n\n`;
    }

    if (details.trend) {
      analysis += `📈 **Análisis de Tendencia:**\n`;
      analysis += `• Evolución de la asistencia en el tiempo\n`;
      analysis += `• Identificación de patrones estacionales\n`;
      analysis += `• Predicción de tendencias futuras\n\n`;
    }

    analysis += `💡 **Recomendaciones Inteligentes:**\n`;
    if (details.focus === 'late') {
      analysis += `• Implementar sistema de puntualidad\n`;
      analysis += `• Establecer consecuencias claras\n`;
      analysis += `• Comunicación con familias\n`;
    } else if (details.focus === 'absent') {
      analysis += `• Investigar causas de ausentismo\n`;
      analysis += `• Implementar estrategias de retención\n`;
      analysis += `• Seguimiento individualizado\n`;
    } else {
      analysis += `• Identificar causas de ausentismo por materia\n`;
      analysis += `• Implementar estrategias de motivación\n`;
      analysis += `• Establecer comunicación con familias\n`;
      analysis += `• Crear programas de retención estudiantil\n`;
    }

    return analysis;
  };

  const generateAdvancedRiskAnalysis = (details: any): string => {
    if (!students || !calificaciones || !attendances) {
      return '❌ No tengo suficientes datos para identificar estudiantes en riesgo.';
    }

    let analysis = `⚠️ **Análisis Avanzado de Estudiantes en Riesgo**\n\n`;

    // Calculate risk levels based on details
    const riskLevel = details.level || 'general';
    const riskType = details.type || 'combined';

    const riskStudents = students.filter(student => {
      const studentGrades = calificaciones.filter(g => g.studentId === student.firestoreId);
      const studentAttendance = attendances.filter(a => a.studentId === student.firestoreId);
      
      const averageGrade = studentGrades.length > 0 
        ? studentGrades.reduce((sum, g) => sum + g.valor, 0) / studentGrades.length 
        : 10;
      
      const attendanceRate = studentAttendance.length > 0
        ? (studentAttendance.filter(a => a.present).length / studentAttendance.length) * 100
        : 100;

      // Different risk criteria based on type
      if (riskType === 'academic') {
        return averageGrade < 6;
      } else if (riskType === 'attendance') {
        return attendanceRate < 80;
      } else {
      return averageGrade < 6 || attendanceRate < 80;
      }
    });

    const criticalStudents = students.filter(student => {
      const studentGrades = calificaciones.filter(g => g.studentId === student.firestoreId);
      const studentAttendance = attendances.filter(a => a.studentId === student.firestoreId);
      
      const averageGrade = studentGrades.length > 0 
        ? studentGrades.reduce((sum, g) => sum + g.valor, 0) / studentGrades.length 
        : 10;
      
      const attendanceRate = studentAttendance.length > 0
        ? (studentAttendance.filter(a => a.present).length / studentAttendance.length) * 100
        : 100;

      return averageGrade < 4 || attendanceRate < 60;
    });

    if (riskLevel === 'critical') {
      analysis += `🔴 **Estudiantes en Riesgo Crítico:**\n`;
      analysis += `• Total de estudiantes críticos: **${criticalStudents.length}**\n`;
      analysis += `• Porcentaje de la población: **${((criticalStudents.length / students.length) * 100).toFixed(1)}%**\n`;
      analysis += `• Requieren intervención inmediata\n\n`;
    } else if (riskLevel === 'high') {
      analysis += `🟡 **Estudiantes en Alto Riesgo:**\n`;
      analysis += `• Total de estudiantes en riesgo: **${riskStudents.length}**\n`;
      analysis += `• Estudiantes críticos: **${criticalStudents.length}**\n`;
      analysis += `• Porcentaje de la población: **${((riskStudents.length / students.length) * 100).toFixed(1)}%**\n\n`;
    } else {
      analysis += `⚠️ **Análisis General de Riesgo:**\n`;
      analysis += `• Total de estudiantes en riesgo: **${riskStudents.length}**\n`;
      analysis += `• Estudiantes críticos: **${criticalStudents.length}**\n`;
      analysis += `• Porcentaje de la población: **${((riskStudents.length / students.length) * 100).toFixed(1)}%**\n\n`;
    }

    // Add type-specific analysis
    if (riskType === 'academic') {
      analysis += `📚 **Análisis de Riesgo Académico:**\n`;
      analysis += `• Criterio: Calificación promedio < 6\n`;
      analysis += `• Estudiantes afectados: **${riskStudents.length}**\n\n`;
    } else if (riskType === 'attendance') {
      analysis += `📅 **Análisis de Riesgo por Asistencia:**\n`;
      analysis += `• Criterio: Tasa de asistencia < 80%\n`;
      analysis += `• Estudiantes afectados: **${riskStudents.length}**\n\n`;
    } else {
      analysis += `🎯 **Criterios de Riesgo Combinados:**\n`;
      analysis += `• Calificación promedio < 6\n`;
      analysis += `• Tasa de asistencia < 80%\n`;
      analysis += `• Estudiantes afectados: **${riskStudents.length}**\n\n`;
    }

    analysis += `💡 **Recomendaciones Inteligentes:**\n`;
    if (riskLevel === 'critical') {
      analysis += `• Intervención inmediata requerida\n`;
      analysis += `• Contacto urgente con familias\n`;
      analysis += `• Plan de acción personalizado\n`;
      analysis += `• Seguimiento diario de progreso\n`;
    } else {
      analysis += `• Programar reuniones con estudiantes en riesgo\n`;
      analysis += `• Implementar planes de apoyo académico\n`;
      analysis += `• Establecer seguimiento semanal de progreso\n`;
      analysis += `• Crear alertas automáticas para seguimiento\n`;
    }

    return analysis;
  };

  const generateAdvancedSystemStats = (details: any): string => {
    let analysis = `📈 **Estadísticas Avanzadas del Sistema**\n\n`;

    // Basic stats
    analysis += `📊 **Datos Generales:**\n`;
    analysis += `• 👥 Estudiantes: **${students?.length || 0}**\n`;
    analysis += `• 🎓 Cursos: **${courses?.length || 0}**\n`;
    analysis += `• 📚 Materias: **${subjects?.length || 0}**\n`;
    analysis += `• 👨‍🏫 Docentes: **${teachers?.length || 0}**\n`;
    analysis += `• 📅 Registros de asistencia: **${attendances?.length || 0}**\n`;
    analysis += `• 📝 Calificaciones: **${calificaciones?.length || 0}**\n`;
    analysis += `• 📋 Boletines: **${boletines?.length || 0}**\n`;
    analysis += `• ⚠️ Alertas: **${alerts?.length || 0}**\n\n`;

    // Advanced calculations
    if (students && calificaciones) {
      const averageGrade = calificaciones.reduce((sum, g) => sum + g.valor, 0) / calificaciones.length;
      analysis += `📈 **Métricas de Rendimiento:**\n`;
      analysis += `• Promedio general: **${averageGrade.toFixed(2)}**\n`;
      analysis += `• Estudiantes con calificaciones: **${new Set(calificaciones.map(g => g.studentId)).size}**\n`;
      analysis += `• Promedio de calificaciones por estudiante: **${(calificaciones.length / students.length).toFixed(1)}**\n\n`;
    }

    if (attendances) {
      const attendanceRate = (attendances.filter(a => a.present).length / attendances.length) * 100;
      analysis += `📅 **Métricas de Asistencia:**\n`;
      analysis += `• Tasa de asistencia general: **${attendanceRate.toFixed(1)}%**\n`;
      analysis += `• Estudiantes con registros de asistencia: **${new Set(attendances.map(a => a.studentId)).size}**\n\n`;
    }

    // System health indicators
    analysis += `🔧 **Estado del Sistema:**\n`;
    analysis += `• ✅ Base de datos: Funcionando\n`;
    analysis += `• ✅ Análisis inteligente: Activo\n`;
    analysis += `• ✅ Alertas automáticas: Configuradas\n`;
    analysis += `• ✅ Reportes: Generación automática\n\n`;

    // Recent activity
    const recentBoletines = boletines?.filter((b: any) => {
      const date = new Date(b.fechaGeneracion || b.createdAt);
      const now = new Date();
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }).length || 0;

    analysis += `📅 **Actividad Reciente (7 días):**\n`;
    analysis += `• Boletines generados: **${recentBoletines}**\n`;
    analysis += `• Alertas activas: **${alerts?.filter((a: any) => a.activa).length || 0}**\n\n`;

    analysis += `🚀 **Funcionalidades Activas:**\n`;
    analysis += `• Análisis inteligente de datos\n`;
    analysis += `• Generación automática de reportes\n`;
    analysis += `• Sistema de alertas en tiempo real\n`;
    analysis += `• Dashboard interactivo\n`;
    analysis += `• Predicciones y tendencias\n`;

    return analysis;
  };

  const generateAdvancedHelpResponse = (details: any): string => {
    let analysis = `🤖 **Comandos y Funcionalidades Avanzadas**\n\n`;

    // Category-specific help
    if (details.category === 'analysis') {
      analysis += `📊 **Análisis de Datos Avanzado:**\n`;
      analysis += `• "Analizar rendimiento académico detallado"\n`;
      analysis += `• "Ver estadísticas de asistencia por período"\n`;
      analysis += `• "Identificar estudiantes en riesgo crítico"\n`;
      analysis += `• "Mostrar estadísticas del sistema completo"\n`;
      analysis += `• "Comparar rendimiento entre cursos"\n`;
      analysis += `• "Análisis de tendencias y predicciones"\n\n`;
    } else if (details.category === 'users') {
      analysis += `👥 **Gestión de Usuarios:**\n`;
      analysis += `• "Crear usuario administrador"\n`;
      analysis += `• "Gestionar roles y permisos"\n`;
      analysis += `• "Estudiantes con mejor rendimiento"\n`;
      analysis += `• "Profesores destacados"\n`;
      analysis += `• "Cursos más populares"\n`;
      analysis += `• "Materias con mejor promedio"\n\n`;
    } else if (details.category === 'reports') {
      analysis += `📋 **Reportes y Documentos:**\n`;
      analysis += `• "Generar boletines automáticos"\n`;
      analysis += `• "Ver alertas críticas"\n`;
      analysis += `• "Exportar reportes personalizados"\n`;
      analysis += `• "Análisis comparativo completo"\n`;
      analysis += `• "Predicciones de rendimiento"\n`;
      analysis += `• "Recomendaciones inteligentes"\n\n`;
    } else {
      analysis += `📊 **Análisis de Datos:**\n`;
      analysis += `• "Analizar rendimiento académico"\n`;
      analysis += `• "Ver estadísticas de asistencia"\n`;
      analysis += `• "Identificar estudiantes en riesgo"\n`;
      analysis += `• "Mostrar estadísticas del sistema"\n\n`;

      analysis += `👥 **Gestión de Usuarios:**\n`;
      analysis += `• "Crear usuario" / "Usuarios"\n`;
      analysis += `• "Estudiantes" / "Información de estudiantes"\n`;
      analysis += `• "Profesores" / "Docentes"\n`;
      analysis += `• "Cursos" / "Información de cursos"\n`;
      analysis += `• "Materias" / "Asignaturas"\n\n`;

      analysis += `📋 **Reportes y Documentos:**\n`;
      analysis += `• "Boletines" / "Información de boletines"\n`;
      analysis += `• "Alertas" / "Ver alertas"\n`;
      analysis += `• "Generar reporte"\n\n`;
    }

    analysis += `❓ **Consultas Específicas:**\n`;
    analysis += `• "¿Cuántos estudiantes hay?"\n`;
    analysis += `• "¿Cuál es el promedio general?"\n`;
    analysis += `• "¿Hay alertas activas?"\n`;
    analysis += `• "¿Cuántos docentes están activos?"\n`;
    analysis += `• "¿Cuál es la tendencia de asistencia?"\n`;
    analysis += `• "¿Qué materias tienen mejor rendimiento?"\n\n`;

    analysis += `⚡ **Comandos Especiales:**\n`;
    analysis += `• "Ayuda" - Mostrar esta lista\n`;
    analysis += `• "Estadísticas" - Ver datos del sistema\n`;
    analysis += `• "Análisis completo" - Generar reporte detallado\n`;
    analysis += `• "Comparar" - Análisis comparativo\n`;
    analysis += `• "Predicción" - Análisis predictivo\n`;
    analysis += `• "Recomendación" - Sugerencias inteligentes\n\n`;

    analysis += `💡 **Sugerencias Avanzadas:**\n`;
    analysis += `• Puedes hacer preguntas en lenguaje natural\n`;
    analysis += `• El bot analiza el contexto de tu consulta\n`;
    analysis += `• Respuestas personalizadas según tus necesidades\n`;
    analysis += `• Usa los botones de acción rápida para acceso directo\n`;
    analysis += `• Solicita análisis detallados o comparativos\n`;

    return analysis;
  };

  const generateAdvancedGreeting = (details: any): string => {
    const hour = details.time || new Date().getHours();
    const userName = details.user || user?.email?.split('@')[0];
    
    let greeting = '';
    if (hour < 12) greeting = '🌅 ¡Buenos días!';
    else if (hour < 18) greeting = '🌞 ¡Buenas tardes!';
    else greeting = '🌙 ¡Buenas noches!';

    let analysis = `${greeting} ${userName}! 🤖\n\n`;

    analysis += `¿En qué puedo ayudarte hoy? Puedo:\n`;
    analysis += `• 📊 Analizar datos académicos de manera inteligente\n`;
    analysis += `• 📈 Generar reportes personalizados\n`;
    analysis += `• 🔍 Realizar análisis comparativos\n`;
    analysis += `• 📊 Proporcionar insights educativos avanzados\n`;
    analysis += `• ⚡ Responder consultas específicas del sistema\n`;
    analysis += `• 🎯 Crear recomendaciones personalizadas\n\n`;

    analysis += `**💡 Funcionalidades Avanzadas:**\n`;
    analysis += `• Análisis de tendencias y predicciones\n`;
    analysis += `• Comparaciones entre diferentes períodos\n`;
    analysis += `• Identificación de patrones de rendimiento\n`;
    analysis += `• Generación de alertas inteligentes\n`;
    analysis += `• Optimización de procesos académicos\n\n`;

    analysis += `Solo dime qué necesitas y te ayudo con análisis inteligente. 🚀`;

    return analysis;
  };

  const generateAdvancedUserInfo = (details: any): string => {
    const totalUsers = teachers?.length || 0;
    const activeUsers = teachers?.filter((t: any) => t.activo !== false).length || 0;
    const inactiveUsers = totalUsers - activeUsers;
    
    let analysis = `👥 **Información Avanzada de Usuarios**\n\n`;

    // Action-specific analysis
    if (details.action === 'create') {
      analysis += `➕ **Creación de Usuarios:**\n`;
      analysis += `• Proceso simplificado disponible\n`;
      analysis += `• Roles predefinidos: Admin, Profesor, Estudiante\n`;
      analysis += `• Validación automática de datos\n`;
      analysis += `• Notificaciones de confirmación\n\n`;
    } else {
      analysis += `📊 **Estadísticas de Usuarios:**\n`;
      analysis += `• Total de usuarios: **${totalUsers}**\n`;
      analysis += `• Usuarios activos: **${activeUsers}** (${((activeUsers / totalUsers) * 100).toFixed(1)}%)\n`;
      analysis += `• Usuarios inactivos: **${inactiveUsers}** (${((inactiveUsers / totalUsers) * 100).toFixed(1)}%)\n\n`;
    }

    // Role-specific analysis
    if (details.role === 'admin') {
      analysis += `👑 **Usuarios Administradores:**\n`;
      analysis += `• Acceso completo al sistema\n`;
      analysis += `• Gestión de usuarios y permisos\n`;
      analysis += `• Configuración del sistema\n`;
      analysis += `• Reportes administrativos\n\n`;
    } else if (details.role === 'teacher') {
      analysis += `👨‍🏫 **Usuarios Docentes:**\n`;
      analysis += `• Gestión de calificaciones\n`;
      analysis += `• Registro de asistencia\n`;
      analysis += `• Generación de boletines\n`;
      analysis += `• Comunicación con estudiantes\n\n`;
    }

    analysis += `💡 **Funcionalidades Disponibles:**\n`;
    analysis += `• Crear nuevos usuarios\n`;
    analysis += `• Gestionar roles y permisos\n`;
    analysis += `• Activar/desactivar usuarios\n`;
    analysis += `• Ver historial de actividad\n`;
    analysis += `• Configuración de perfiles\n\n`;

    if (details.action === 'create') {
      analysis += `🔧 **Proceso de Creación:**\n`;
      analysis += `1. Ve a la sección "Usuarios"\n`;
      analysis += `2. Haz clic en "Agregar Usuario"\n`;
      analysis += `3. Completa los datos requeridos\n`;
      analysis += `4. Asigna el rol correspondiente\n`;
      analysis += `5. Confirma la creación\n\n`;
    }

    analysis += `¿Necesitas ayuda con algún proceso específico?`;

    return analysis;
  };

  const generateAdvancedStudentInfo = (details: any): string => {
    const totalStudents = students?.length || 0;
    const activeStudents = students?.filter((s: any) => s.activo !== false).length || 0;
    const inactiveStudents = totalStudents - activeStudents;
    
    let analysis = `🎓 **Información Avanzada de Estudiantes**\n\n`;

    // Focus-specific analysis
    if (details.focus === 'top') {
      const topStudents = students?.filter((s: any) => {
        const studentGrades = calificaciones?.filter((g: any) => g.studentId === s.firestoreId) || [];
        const averageGrade = studentGrades.length > 0 
          ? studentGrades.reduce((sum: any, g: any) => sum + g.valor, 0) / studentGrades.length 
          : 0;
        return averageGrade >= 8;
      }) || [];
      
      analysis += `⭐ **Estudiantes Destacados:**\n`;
      analysis += `• Total de destacados: **${topStudents.length}**\n`;
      analysis += `• Porcentaje de la población: **${((topStudents.length / totalStudents) * 100).toFixed(1)}%**\n`;
      analysis += `• Criterio: Promedio ≥ 8\n\n`;
    } else if (details.focus === 'bottom') {
      const bottomStudents = students?.filter((s: any) => {
        const studentGrades = calificaciones?.filter((g: any) => g.studentId === s.firestoreId) || [];
        const averageGrade = studentGrades.length > 0 
          ? studentGrades.reduce((sum: any, g: any) => sum + g.valor, 0) / studentGrades.length 
          : 10;
        return averageGrade < 6;
      }) || [];
      
      analysis += `⚠️ **Estudiantes en Riesgo:**\n`;
      analysis += `• Total en riesgo: **${bottomStudents.length}**\n`;
      analysis += `• Porcentaje de la población: **${((bottomStudents.length / totalStudents) * 100).toFixed(1)}%**\n`;
      analysis += `• Criterio: Promedio < 6\n\n`;
    } else {
      analysis += `📊 **Estadísticas Generales:**\n`;
      analysis += `• Total de estudiantes: **${totalStudents}**\n`;
      analysis += `• Estudiantes activos: **${activeStudents}** (${((activeStudents / totalStudents) * 100).toFixed(1)}%)\n`;
      analysis += `• Estudiantes inactivos: **${inactiveStudents}** (${((inactiveStudents / totalStudents) * 100).toFixed(1)}%)\n`;
      analysis += `• Con calificaciones: **${new Set(calificaciones?.map((g: any) => g.studentId) || []).size}**\n`;
      analysis += `• Con asistencia: **${new Set(attendances?.map((a: any) => a.studentId) || []).size}**\n\n`;
    }

    // Course-specific analysis
    if (details.course) {
      analysis += `📚 **Análisis por Curso (${details.course}):**\n`;
      analysis += `• Estudiantes en este curso\n`;
      analysis += `• Rendimiento específico\n`;
      analysis += `• Comparación con otros cursos\n\n`;
    }

    // Grade-specific analysis
    if (details.grade) {
      analysis += `📈 **Análisis por Calificación (${details.grade}):**\n`;
      analysis += `• Estudiantes con esta calificación\n`;
      analysis += `• Distribución de notas\n`;
      analysis += `• Tendencia de rendimiento\n\n`;
    }

    // Performance metrics
    if (calificaciones?.length > 0) {
      const averageGrade = calificaciones.reduce((sum: any, g: any) => sum + g.valor, 0) / calificaciones.length;
      analysis += `📈 **Métricas de Rendimiento:**\n`;
      analysis += `• Promedio general: **${averageGrade.toFixed(2)}**\n`;
      analysis += `• Calificaciones registradas: **${calificaciones.length}**\n`;
      analysis += `• Estudiantes evaluados: **${new Set(calificaciones.map((g: any) => g.studentId)).size}**\n\n`;
    }

    if (attendances?.length > 0) {
      const attendanceRate = (attendances.filter((a: any) => a.present).length / attendances.length) * 100;
      analysis += `📅 **Métricas de Asistencia:**\n`;
      analysis += `• Tasa de asistencia: **${attendanceRate.toFixed(1)}%**\n`;
      analysis += `• Registros de asistencia: **${attendances.length}**\n`;
      analysis += `• Estudiantes con asistencia: **${new Set(attendances.map((a: any) => a.studentId)).size}**\n\n`;
    }

    analysis += `💡 **Funcionalidades Disponibles:**\n`;
    analysis += `• Registrar nuevos estudiantes\n`;
    analysis += `• Ver historial académico\n`;
    analysis += `• Gestionar matrículas\n`;
    analysis += `• Generar reportes individuales\n`;
    analysis += `• Análisis de tendencias\n\n`;

    analysis += `¿Quieres ver información específica de algún estudiante?`;

    return analysis;
  };

  const generateAdvancedTeacherInfo = (details: any): string => {
    const totalTeachers = teachers?.length || 0;
    const activeTeachers = teachers?.filter((t: any) => t.activo !== false).length || 0;
    const inactiveTeachers = totalTeachers - activeTeachers;
    
    let analysis = `👨‍🏫 **Información Avanzada de Docentes**\n\n`;

    // Focus-specific analysis
    if (details.focus === 'top') {
      analysis += `⭐ **Docentes Destacados:**\n`;
      analysis += `• Criterios de evaluación: Rendimiento de estudiantes\n`;
      analysis += `• Materias con mejor promedio\n`;
      analysis += `• Reconocimientos y logros\n\n`;
    } else {
      analysis += `📊 **Estadísticas Generales:**\n`;
      analysis += `• Total de docentes: **${totalTeachers}**\n`;
      analysis += `• Docentes activos: **${activeTeachers}** (${((activeTeachers / totalTeachers) * 100).toFixed(1)}%)\n`;
      analysis += `• Docentes inactivos: **${inactiveTeachers}** (${((inactiveTeachers / totalTeachers) * 100).toFixed(1)}%)\n`;
      analysis += `• Materias asignadas: **${subjects?.length || 0}**\n\n`;
    }

    // Subject-specific analysis
    if (details.subject) {
      analysis += `📚 **Análisis por Materia (${details.subject}):**\n`;
      analysis += `• Docentes asignados a esta materia\n`;
      analysis += `• Rendimiento de estudiantes\n`;
      analysis += `• Comparación entre docentes\n\n`;
    }

    // Distribution analysis
    analysis += `📈 **Distribución de Carga:**\n`;
    analysis += `• Materias con docente asignado: **${subjects?.length || 0}**\n`;
    analysis += `• Cursos atendidos: **${courses?.length || 0}**\n`;
    analysis += `• Promedio de materias por docente: **${subjects?.length && teachers?.length ? (subjects.length / teachers.length).toFixed(1) : 'N/A'}**\n\n`;

    // Performance metrics
    if (calificaciones?.length > 0 && subjects?.length > 0) {
      analysis += `📊 **Métricas de Rendimiento:**\n`;
      analysis += `• Calificaciones registradas: **${calificaciones.length}**\n`;
      analysis += `• Materias con calificaciones: **${new Set(calificaciones.map((g: any) => g.subjectId)).size}**\n`;
      analysis += `• Promedio general de estudiantes: **${(calificaciones.reduce((sum: any, g: any) => sum + g.valor, 0) / calificaciones.length).toFixed(2)}**\n\n`;
    }

    analysis += `💡 **Funcionalidades Disponibles:**\n`;
    analysis += `• Registrar nuevos docentes\n`;
    analysis += `• Asignar materias\n`;
    analysis += `• Gestionar horarios\n`;
    analysis += `• Ver historial de clases\n`;
    analysis += `• Evaluación de rendimiento\n`;
    analysis += `• Gestión de carga académica\n\n`;

    analysis += `¿Necesitas información específica de algún docente?`;

    return analysis;
  };

  const generateAdvancedCourseInfo = (details: any): string => {
    const totalCourses = courses?.length || 0;
    const activeCourses = courses?.filter((c: any) => c.activo !== false).length || 0;
    const inactiveCourses = totalCourses - activeCourses;
    
    let analysis = `🎓 **Información Avanzada de Cursos**\n\n`;

    // Course-specific analysis
    if (details.course) {
      analysis += `📚 **Análisis del Curso (${details.course}):**\n`;
      analysis += `• Estudiantes matriculados\n`;
      analysis += `• Materias asignadas\n`;
      analysis += `• Rendimiento específico\n`;
      analysis += `• Comparación con otros cursos\n\n`;
    } else {
      analysis += `📊 **Estadísticas Generales:**\n`;
      analysis += `• Total de cursos: **${totalCourses}**\n`;
      analysis += `• Cursos activos: **${activeCourses}** (${((activeCourses / totalCourses) * 100).toFixed(1)}%)\n`;
      analysis += `• Cursos inactivos: **${inactiveCourses}** (${((inactiveCourses / totalCourses) * 100).toFixed(1)}%)\n`;
      analysis += `• Estudiantes matriculados: **${students?.length || 0}**\n`;
      analysis += `• Materias disponibles: **${subjects?.length || 0}**\n\n`;
    }

    // Comparison analysis
    if (details.comparison) {
      analysis += `🔄 **Análisis Comparativo:**\n`;
      analysis += `• Comparación entre cursos\n`;
      analysis += `• Rendimiento relativo\n`;
      analysis += `• Distribución de estudiantes\n`;
      analysis += `• Eficiencia académica\n\n`;
    }

    // Performance metrics
    if (courses?.length > 0 && students?.length > 0) {
      analysis += `📈 **Métricas de Distribución:**\n`;
      analysis += `• Promedio de estudiantes por curso: **${(students.length / courses.length).toFixed(1)}**\n`;
      analysis += `• Materias promedio por curso: **${subjects?.length && courses?.length ? (subjects.length / courses.length).toFixed(1) : 'N/A'}**\n`;
      analysis += `• Densidad estudiantil: **${(students.length / courses.length).toFixed(1)} estudiantes/curso**\n\n`;
    }

    // Course performance analysis
    if (calificaciones?.length > 0 && courses?.length > 0) {
      analysis += `📊 **Rendimiento por Curso:**\n`;
      analysis += `• Calificaciones registradas: **${calificaciones.length}**\n`;
      analysis += `• Promedio general: **${(calificaciones.reduce((sum: any, g: any) => sum + g.valor, 0) / calificaciones.length).toFixed(2)}**\n`;
      analysis += `• Estudiantes evaluados: **${new Set(calificaciones.map((g: any) => g.studentId)).size}**\n\n`;
    }

    analysis += `💡 **Funcionalidades Disponibles:**\n`;
    analysis += `• Crear nuevos cursos\n`;
    analysis += `• Gestionar matrículas\n`;
    analysis += `• Asignar materias\n`;
    analysis += `• Generar reportes por curso\n`;
    analysis += `• Análisis de rendimiento\n`;
    analysis += `• Gestión de horarios\n\n`;

    analysis += `¿Quieres ver información específica de algún curso?`;

    return analysis;
  };

  const generateAdvancedSubjectInfo = (details: any): string => {
    const totalSubjects = subjects?.length || 0;
    const activeSubjects = subjects?.filter((s: any) => s.activo !== false).length || 0;
    const inactiveSubjects = totalSubjects - activeSubjects;
    
    let analysis = `📚 **Información Avanzada de Materias**\n\n`;

    // Subject-specific analysis
    if (details.subject) {
      analysis += `📖 **Análisis de la Materia (${details.subject}):**\n`;
      analysis += `• Docentes asignados\n`;
      analysis += `• Estudiantes matriculados\n`;
      analysis += `• Rendimiento específico\n`;
      analysis += `• Comparación con otras materias\n\n`;
    } else {
      analysis += `📊 **Estadísticas Generales:**\n`;
      analysis += `• Total de materias: **${totalSubjects}**\n`;
      analysis += `• Materias activas: **${activeSubjects}** (${((activeSubjects / totalSubjects) * 100).toFixed(1)}%)\n`;
      analysis += `• Materias inactivas: **${inactiveSubjects}** (${((inactiveSubjects / totalSubjects) * 100).toFixed(1)}%)\n`;
      analysis += `• Docentes asignados: **${teachers?.length || 0}**\n`;
      analysis += `• Calificaciones registradas: **${calificaciones?.length || 0}**\n\n`;
    }

    // Performance analysis
    if (details.performance && calificaciones?.length > 0) {
      analysis += `📈 **Análisis de Rendimiento:**\n`;
      analysis += `• Promedio general: **${(calificaciones.reduce((sum: any, g: any) => sum + g.valor, 0) / calificaciones.length).toFixed(2)}**\n`;
      analysis += `• Materias con calificaciones: **${new Set(calificaciones.map((g: any) => g.subjectId)).size}**\n`;
      analysis += `• Estudiantes evaluados: **${new Set(calificaciones.map((g: any) => g.studentId)).size}**\n\n`;
    }

    // Distribution analysis
    if (courses?.length > 0) {
      analysis += `📈 **Distribución por Curso:**\n`;
      analysis += `• Materias promedio por curso: **${(subjects?.length / courses.length).toFixed(1)}**\n`;
      analysis += `• Cobertura de materias: **${((subjects?.length / courses.length) * 100).toFixed(1)}%**\n\n`;
    }

    analysis += `💡 **Funcionalidades Disponibles:**\n`;
    analysis += `• Crear nuevas materias\n`;
    analysis += `• Asignar docentes\n`;
    analysis += `• Gestionar horarios\n`;
    analysis += `• Ver rendimiento por materia\n`;
    analysis += `• Análisis de tendencias\n`;
    analysis += `• Gestión de carga académica\n\n`;

    analysis += `¿Necesitas información específica de alguna materia?`;

    return analysis;
  };

  const generateAdvancedBoletinInfo = (details: any): string => {
    const totalBoletines = boletines?.length || 0;
    const recentBoletines = boletines?.filter((b: any) => {
      const date = new Date(b.fechaGeneracion || b.createdAt);
      const now = new Date();
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 30;
    }).length || 0;
    
    let analysis = `📋 **Información Avanzada de Boletines**\n\n`;

    // Action-specific analysis
    if (details.action === 'generate') {
      analysis += `🔄 **Generación de Boletines:**\n`;
      analysis += `• Proceso automatizado disponible\n`;
      analysis += `• Generación por período académico\n`;
      analysis += `• Inclusión de observaciones IA\n`;
      analysis += `• Exportación en múltiples formatos\n\n`;
    } else {
      analysis += `📊 **Estadísticas Generales:**\n`;
      analysis += `• Total de boletines: **${totalBoletines}**\n`;
      analysis += `• Boletines recientes (30 días): **${recentBoletines}**\n`;
      analysis += `• Estudiantes con boletines: **${students?.length || 0}**\n`;
      analysis += `• Cursos con boletines: **${courses?.length || 0}**\n\n`;
    }

    // Period-specific analysis
    if (details.period !== 'all') {
      analysis += `📅 **Análisis por Período (${details.period}):**\n`;
      analysis += `• Boletines del período específico\n`;
      analysis += `• Comparación con períodos anteriores\n`;
      analysis += `• Tendencias de rendimiento\n\n`;
    }

    // Performance metrics
    if (students?.length > 0) {
      analysis += `📈 **Métricas de Distribución:**\n`;
      analysis += `• Promedio de boletines por estudiante: **${(boletines?.length / students.length).toFixed(1)}**\n`;
      analysis += `• Boletines con observaciones: **${boletines?.filter((b: any) => b.observacionAutomatica).length || 0}**\n`;
      analysis += `• Cobertura estudiantil: **${((boletines?.length / students.length) * 100).toFixed(1)}%**\n\n`;
    }

    analysis += `💡 **Funcionalidades Disponibles:**\n`;
    analysis += `• Generar boletines automáticos\n`;
    analysis += `• Ver historial de boletines\n`;
    analysis += `• Exportar reportes\n`;
    analysis += `• Gestionar observaciones\n`;
    analysis += `• Análisis de tendencias\n`;
    analysis += `• Configuración de formatos\n\n`;

    if (details.action === 'generate') {
      analysis += `🔧 **Proceso de Generación:**\n`;
      analysis += `1. Seleccionar período académico\n`;
      analysis += `2. Elegir estudiantes o cursos\n`;
      analysis += `3. Configurar observaciones IA\n`;
      analysis += `4. Generar y revisar\n`;
      analysis += `5. Exportar o compartir\n\n`;
    }

    analysis += `¿Quieres generar un nuevo boletín o ver alguno específico?`;

    return analysis;
  };

  const generateAdvancedAlertInfo = (details: any): string => {
    const totalAlerts = alerts?.length || 0;
    const activeAlerts = alerts?.filter((a: any) => a.activa !== false).length || 0;
    const criticalAlerts = alerts?.filter((a: any) => a.tipo === 'critica').length || 0;
    const resolvedAlerts = totalAlerts - activeAlerts;
    
    let analysis = `⚠️ **Información Avanzada de Alertas**\n\n`;

    // Type-specific analysis
    if (details.type === 'critical') {
      analysis += `🔴 **Alertas Críticas:**\n`;
      analysis += `• Total de alertas críticas: **${criticalAlerts}**\n`;
      analysis += `• Porcentaje del total: **${((criticalAlerts / totalAlerts) * 100).toFixed(1)}%**\n`;
      analysis += `• Requieren atención inmediata\n`;
      analysis += `• Prioridad máxima\n\n`;
    } else {
      analysis += `📊 **Estadísticas Generales:**\n`;
      analysis += `• Total de alertas: **${totalAlerts}**\n`;
      analysis += `• Alertas activas: **${activeAlerts}** (${((activeAlerts / totalAlerts) * 100).toFixed(1)}%)\n`;
      analysis += `• Alertas críticas: **${criticalAlerts}**\n`;
      analysis += `• Alertas resueltas: **${resolvedAlerts}** (${((resolvedAlerts / totalAlerts) * 100).toFixed(1)}%)\n\n`;
    }

    // Status-specific analysis
    if (details.status === 'active') {
      analysis += `⚠️ **Alertas Activas:**\n`;
      analysis += `• Requieren seguimiento\n`;
      analysis += `• Acciones pendientes\n`;
      analysis += `• Priorización necesaria\n\n`;
    }

    // Distribution analysis
    if (students?.length > 0) {
      analysis += `📈 **Distribución por Estudiante:**\n`;
      analysis += `• Alertas promedio por estudiante: **${(alerts?.length / students.length).toFixed(1)}**\n`;
      analysis += `• Tasa de resolución: **${totalAlerts > 0 ? (((totalAlerts - activeAlerts) / totalAlerts) * 100).toFixed(1) : 'N/A'}%**\n`;
      analysis += `• Eficiencia del sistema de alertas\n\n`;
    }

    analysis += `💡 **Tipos de Alertas Disponibles:**\n`;
    analysis += `• Bajo rendimiento académico\n`;
    analysis += `• Ausentismo frecuente\n`;
    analysis += `• Faltas de asistencia\n`;
    analysis += `• Alertas del sistema\n`;
    analysis += `• Alertas personalizadas\n\n`;

    analysis += `🔧 **Funcionalidades:**\n`;
    analysis += `• Crear nuevas alertas\n`;
    analysis += `• Gestionar alertas existentes\n`;
    analysis += `• Configurar alertas automáticas\n`;
    analysis += `• Seguimiento de resolución\n`;
    analysis += `• Reportes de alertas\n\n`;

    analysis += `¿Quieres ver alertas específicas o crear una nueva?`;

    return analysis;
  };

  const generateIntelligentGeneralResponse = (input: string, context: any): string => {
    let analysis = `🤖 **Análisis Inteligente de tu Consulta**\n\n`;

    // Analyze input complexity
    const wordCount = input.split(' ').length;
    const hasNumbers = /\d/.test(input);
    const hasQuestions = /\?/.test(input);

    if (wordCount > 10) {
      analysis += `📝 **Consulta Detallada Detectada:**\n`;
      analysis += `• Análisis profundo requerido\n`;
      analysis += `• Múltiples aspectos a considerar\n`;
      analysis += `• Respuesta personalizada en desarrollo\n\n`;
    } else if (hasNumbers) {
      analysis += `🔢 **Consulta Numérica Detectada:**\n`;
      analysis += `• Búsqueda de datos específicos\n`;
      analysis += `• Análisis cuantitativo en proceso\n`;
      analysis += `• Métricas relevantes identificadas\n\n`;
    } else if (hasQuestions) {
      analysis += `❓ **Consulta Interrogativa Detectada:**\n`;
      analysis += `• Respuesta directa en preparación\n`;
      analysis += `• Información específica solicitada\n`;
      analysis += `• Análisis contextual aplicado\n\n`;
    } else {
      analysis += `💭 **Consulta General Detectada:**\n`;
      analysis += `• Análisis contextual en progreso\n`;
      analysis += `• Información relevante identificada\n`;
      analysis += `• Respuesta personalizada generada\n\n`;
    }

    // Context-based response
    if (context.urgency === 'high') {
      analysis += `⚡ **Prioridad Alta Detectada:**\n`;
      analysis += `• Respuesta inmediata generada\n`;
      analysis += `• Información crítica priorizada\n`;
      analysis += `• Acciones urgentes identificadas\n\n`;
    }

    if (context.complexity === 'advanced') {
      analysis += `🔬 **Análisis Avanzado Aplicado:**\n`;
      analysis += `• Métodos estadísticos avanzados\n`;
      analysis += `• Análisis de correlaciones\n`;
      analysis += `• Predicciones y tendencias\n`;
      analysis += `• Insights profundos generados\n\n`;
    }

    analysis += `💡 **Recomendaciones Inteligentes:**\n`;
    analysis += `• Solicita análisis específicos para obtener información detallada\n`;
    analysis += `• Usa palabras clave como "detallado", "completo", "comparar"\n`;
    analysis += `• Pregunta por tendencias, predicciones o recomendaciones\n`;
    analysis += `• Solicita reportes personalizados según tus necesidades\n\n`;

    analysis += `¿Te gustaría que profundice en algún aspecto específico o que realice un análisis más detallado?`;

    return analysis;
  };

  const generateComparisonAnalysis = (details: any): string => {
    let analysis = `🔄 **Análisis Comparativo Avanzado**\n\n`;

    // Entity-specific comparisons
    if (details.entities?.includes('courses')) {
      analysis += `📚 **Comparación entre Cursos:**\n`;
      analysis += `• Rendimiento académico por curso\n`;
      analysis += `• Tasa de asistencia comparativa\n`;
      analysis += `• Distribución de calificaciones\n`;
      analysis += `• Eficiencia académica relativa\n\n`;
    }

    if (details.entities?.includes('subjects')) {
      analysis += `📖 **Comparación entre Materias:**\n`;
      analysis += `• Promedio de calificaciones por materia\n`;
      analysis += `• Dificultad relativa de asignaturas\n`;
      analysis += `• Rendimiento estudiantil por materia\n`;
      analysis += `• Tendencias de rendimiento\n\n`;
    }

    if (details.entities?.includes('students')) {
      analysis += `👥 **Comparación entre Estudiantes:**\n`;
      analysis += `• Rendimiento individual vs grupal\n`;
      analysis += `• Progreso académico comparativo\n`;
      analysis += `• Patrones de asistencia\n`;
      analysis += `• Evolución de calificaciones\n\n`;
    }

    if (details.entities?.includes('teachers')) {
      analysis += `👨‍🏫 **Comparación entre Docentes:**\n`;
      analysis += `• Efectividad de enseñanza\n`;
      analysis += `• Rendimiento de estudiantes por docente\n`;
      analysis += `• Métricas de satisfacción\n`;
      analysis += `• Eficiencia académica\n\n`;
    }

    // Metric-specific analysis
    if (details.metric === 'average') {
      analysis += `📊 **Análisis de Promedios:**\n`;
      analysis += `• Comparación de promedios generales\n`;
      analysis += `• Tendencias de rendimiento\n`;
      analysis += `• Variaciones estadísticas\n\n`;
    } else if (details.metric === 'attendance') {
      analysis += `📅 **Análisis de Asistencia:**\n`;
      analysis += `• Tasas de asistencia comparativas\n`;
      analysis += `• Patrones de ausentismo\n`;
      analysis += `• Correlación con rendimiento\n\n`;
    } else if (details.metric === 'performance') {
      analysis += `📈 **Análisis de Rendimiento:**\n`;
      analysis += `• Métricas de rendimiento comparativas\n`;
      analysis += `• Indicadores de progreso\n`;
      analysis += `• Factores de éxito\n\n`;
    }

    analysis += `💡 **Insights del Análisis Comparativo:**\n`;
    analysis += `• Identificación de mejores prácticas\n`;
    analysis += `• Áreas de mejora identificadas\n`;
    analysis += `• Patrones de éxito reconocidos\n`;
    analysis += `• Recomendaciones basadas en datos\n`;

    return analysis;
  };

  const generatePredictionAnalysis = (details: any): string => {
    let analysis = `🔮 **Análisis Predictivo Avanzado**\n\n`;

    // Timeframe-specific predictions
    if (details.timeframe === 'week') {
      analysis += `📅 **Predicciones Semanales:**\n`;
      analysis += `• Tendencias de asistencia\n`;
      analysis += `• Proyecciones de rendimiento\n`;
      analysis += `• Alertas anticipadas\n`;
      analysis += `• Planificación académica\n\n`;
    } else if (details.timeframe === 'month') {
      analysis += `📅 **Predicciones Mensuales:**\n`;
      analysis += `• Evolución de calificaciones\n`;
      analysis += `• Patrones de comportamiento\n`;
      analysis += `• Riesgos académicos\n`;
      analysis += `• Oportunidades de mejora\n\n`;
    } else if (details.timeframe === 'quarter') {
      analysis += `📅 **Predicciones Trimestrales:**\n`;
      analysis += `• Rendimiento académico proyectado\n`;
      analysis += `• Tendencias de largo plazo\n`;
      analysis += `• Impacto de intervenciones\n`;
      analysis += `• Planificación estratégica\n\n`;
    } else {
      analysis += `📅 **Predicciones Generales:**\n`;
      analysis += `• Análisis de tendencias\n`;
      analysis += `• Proyecciones de rendimiento\n`;
      analysis += `• Identificación de riesgos\n`;
      analysis += `• Oportunidades de optimización\n\n`;
    }

    // Metric-specific predictions
    if (details.metric === 'average') {
      analysis += `📊 **Predicciones de Promedio:**\n`;
      analysis += `• Evolución de calificaciones\n`;
      analysis += `• Factores influyentes\n`;
      analysis += `• Metas de rendimiento\n\n`;
    } else if (details.metric === 'attendance') {
      analysis += `📅 **Predicciones de Asistencia:**\n`;
      analysis += `• Patrones de asistencia futura\n`;
      analysis += `• Factores de riesgo\n`;
      analysis += `• Estrategias de retención\n\n`;
    } else if (details.metric === 'performance') {
      analysis += `📈 **Predicciones de Rendimiento:**\n`;
      analysis += `• Proyecciones de éxito académico\n`;
      analysis += `• Indicadores de progreso\n`;
      analysis += `• Intervenciones recomendadas\n\n`;
    }

    analysis += `💡 **Insights Predictivos:**\n`;
    analysis += `• Modelos de machine learning aplicados\n`;
    analysis += `• Análisis de patrones históricos\n`;
    analysis += `• Factores de correlación identificados\n`;
    analysis += `• Recomendaciones proactivas\n`;

    return analysis;
  };

  const generateRecommendationAnalysis = (details: any): string => {
    let analysis = `💡 **Análisis de Recomendaciones Avanzado**\n\n`;

    // Area-specific recommendations
    if (details.area === 'academic') {
      analysis += `📚 **Recomendaciones Académicas:**\n`;
      analysis += `• Estrategias de mejora de rendimiento\n`;
      analysis += `• Métodos de estudio optimizados\n`;
      analysis += `• Recursos educativos recomendados\n`;
      analysis += `• Planes de tutoría personalizados\n\n`;
    } else if (details.area === 'attendance') {
      analysis += `📅 **Recomendaciones de Asistencia:**\n`;
      analysis += `• Estrategias de motivación\n`;
      analysis += `• Programas de retención\n`;
      analysis += `• Comunicación con familias\n`;
      analysis += `• Incentivos de asistencia\n\n`;
    } else if (details.area === 'system') {
      analysis += `🔧 **Recomendaciones del Sistema:**\n`;
      analysis += `• Optimización de procesos\n`;
      analysis += `• Mejoras en la interfaz\n`;
      analysis += `• Funcionalidades adicionales\n`;
      analysis += `• Eficiencia operativa\n\n`;
    } else {
      analysis += `🎯 **Recomendaciones Generales:**\n`;
      analysis += `• Mejoras en todos los ámbitos\n`;
      analysis += `• Estrategias integrales\n`;
      analysis += `• Optimización general\n`;
      analysis += `• Desarrollo continuo\n\n`;
    }

    // Priority-based recommendations
    if (details.priority === 'high') {
      analysis += `⚡ **Recomendaciones de Alta Prioridad:**\n`;
      analysis += `• Implementación inmediata requerida\n`;
      analysis += `• Impacto significativo esperado\n`;
      analysis += `• Recursos prioritarios asignados\n`;
      analysis += `• Seguimiento intensivo\n\n`;
    } else {
      analysis += `📋 **Recomendaciones de Prioridad Normal:**\n`;
      analysis += `• Implementación gradual recomendada\n`;
      analysis += `• Monitoreo continuo\n`;
      analysis += `• Evaluación de resultados\n`;
      analysis += `• Ajustes según necesidades\n\n`;
    }

    analysis += `💡 **Insights de Recomendaciones:**\n`;
    analysis += `• Basadas en análisis de datos\n`;
    analysis += `• Personalizadas según contexto\n`;
    analysis += `• Evaluadas por impacto esperado\n`;
    analysis += `• Con seguimiento de resultados\n`;

    return analysis;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isOpen) return;

    const userInput = inputValue.trim();
    addUserMessage(userInput);
    setInputValue('');

    const response = await generateBotResponse(userInput);
    addBotMessage(response);
    setIsTyping(false);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (!isOpen) return;
    
    addUserMessage(suggestion);
    setIsTyping(true);
    const response = await generateBotResponse(suggestion);
    addBotMessage(response);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleBot = () => {
    if (!isOpen) {
      // Limpiar mensajes al abrir por primera vez
      setMessages([]);
      setMessageCount(0);
      setShowQuickActions(false);
      setIsTyping(false);
    }
    setIsOpen(!isOpen);
  };

  const clearChat = () => {
    setMessages([]);
    setMessageCount(0);
    setShowQuickActions(false);
    setIsTyping(false);
  };

  const closeBot = () => {
    setIsOpen(false);
    setMessageCount(0);
    setShowQuickActions(false);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Bot Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen && (
          <div className="relative">
          <Button
            onClick={toggleBot}
              className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
              <Bot className="h-5 w-5 text-white" />
          </Button>
            {messageCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse">
                {messageCount}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Bot Chat Window */}
      {isOpen && (
        <div className={`fixed z-50 bg-white rounded-xl shadow-2xl border transition-all duration-300 ${
          isMinimized 
            ? 'bottom-4 right-4 w-80 h-12' 
            : 'bottom-4 right-4 w-80 h-96'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Bot className="h-4 w-4" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <span className="font-semibold text-sm">Asistente IA</span>
                  <div className="text-xs opacity-80">Inteligencia Artificial</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 p-1 h-6 w-6"
                >
                  {isMinimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeBot}
                  className="text-white hover:bg-white/20 p-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Actions */}
              {showQuickActions && (
                <div className="p-2 bg-gray-50 border-b">
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <Card key={action.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                        <CardContent className="p-2">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${action.color} text-white`}>
                              <action.icon className="h-3 w-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-xs truncate">{action.title}</div>
                              <div className="text-xs text-gray-500 truncate">{action.description}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

          {/* Messages */}
              <div className="flex-1 p-2 h-64">
            <ScrollArea className="h-full">
                  <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                          className={`max-w-[85%] p-2 rounded-lg ${
                        message.type === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {message.suggestions && (
                            <div className="mt-2 space-y-1">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                                  className="w-full text-xs justify-start hover:bg-blue-50 h-6"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                        <div className="bg-gray-100 p-2 rounded-lg">
                      <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
              <div className="p-2 border-t bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="text-gray-500 hover:text-gray-700 p-1 h-7 w-7"
                  >
                    <Zap className="h-3 w-3" />
                  </Button>
                  <div className="flex-1 min-w-0">
                                 <Input
                     ref={inputRef}
                     value={inputValue}
                     onChange={(e) => setInputValue(e.target.value)}
                     onKeyPress={handleKeyPress}
                     placeholder="Escribe tu mensaje..."
                     className="w-full h-7 text-xs"
                     disabled={isTyping || !isOpen}
                   />
                  </div>
                             <Button
                 onClick={handleSendMessage}
                 disabled={!inputValue.trim() || isTyping || !isOpen}
                 size="sm"
                 className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 p-1 h-7 w-7"
               >
                 <Send className="h-3 w-3" />
               </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="text-gray-500 hover:text-red-500 p-1 h-7 w-7"
                    title="Limpiar chat"
                  >
                    <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingBot; 