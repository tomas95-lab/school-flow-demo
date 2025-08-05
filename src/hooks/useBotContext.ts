import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';

export interface BotContext {
  currentModule: string;
  userRole: string;
  availableData: string[];
  recentActions: string[];
  moduleSpecificData?: unknown;
}

export interface BotSuggestion {
  text: string;
  action: string;
  icon?: string;
  priority: 'high' | 'medium' | 'low';
}

export const useBotContext = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [context, setContext] = useState<BotContext>({
    currentModule: 'general',
    userRole: user?.role || 'alumno',
    availableData: [],
    recentActions: []
  });

  // Determine current module from URL
  useEffect(() => {
    const path = location.pathname;
    let module = 'general';
    let moduleData = {};

    if (path.includes('/asistencias')) {
      module = 'asistencias';
      moduleData = {
        title: 'Gestión de Asistencias',
        description: 'Registro y seguimiento de asistencia estudiantil',
        actions: ['Registrar asistencia', 'Ver reportes', 'Analizar patrones']
      };
    } else if (path.includes('/calificaciones')) {
      module = 'calificaciones';
      moduleData = {
        title: 'Gestión de Calificaciones',
        description: 'Registro y seguimiento de calificaciones',
        actions: ['Registrar calificaciones', 'Ver promedios', 'Analizar rendimiento']
      };
    } else if (path.includes('/boletines')) {
      module = 'boletines';
      moduleData = {
        title: 'Gestión de Boletines',
        description: 'Generación y gestión de boletines académicos',
        actions: ['Generar boletines', 'Ver reportes', 'Analizar tendencias']
      };
    } else if (path.includes('/alertas')) {
      module = 'alertas';
      moduleData = {
        title: 'Sistema de Alertas',
        description: 'Gestión de alertas y notificaciones',
        actions: ['Crear alertas', 'Ver alertas activas', 'Configurar notificaciones']
      };
    } else if (path.includes('/usuarios')) {
      module = 'usuarios';
      moduleData = {
        title: 'Gestión de Usuarios',
        description: 'Administración de usuarios del sistema',
        actions: ['Crear usuarios', 'Editar perfiles', 'Gestionar roles']
      };
    } else if (path.includes('/mensajes')) {
      module = 'mensajes';
      moduleData = {
        title: 'Sistema de Mensajería',
        description: 'Comunicación interna del sistema',
        actions: ['Enviar mensajes', 'Ver conversaciones', 'Gestionar grupos']
      };
    } else if (path.includes('/bot')) {
      module = 'bot';
      moduleData = {
        title: 'Bot IA',
        description: 'Asistente inteligente para análisis educativo',
        actions: ['Consultas predefinidas', 'Análisis personalizado', 'Generar reportes']
      };
    } else if (path.includes('/dashboard')) {
      module = 'dashboard';
      moduleData = {
        title: 'Dashboard Principal',
        description: 'Vista general del sistema educativo',
        actions: ['Ver estadísticas', 'Acceso rápido', 'Monitoreo general']
      };
    }

    setContext(prev => ({
      ...prev,
      currentModule: module,
      moduleSpecificData: moduleData
    }));
  }, [location.pathname]);

  // Generate module-specific suggestions
  const getModuleSuggestions = (): BotSuggestion[] => {
    const suggestions: BotSuggestion[] = [];

    switch (context.currentModule) {
      case 'asistencias':
        suggestions.push(
          { text: 'Registrar nueva asistencia', action: 'register_attendance', priority: 'high' },
          { text: 'Ver reporte de asistencia', action: 'view_attendance_report', priority: 'medium' },
          { text: 'Analizar patrones de ausentismo', action: 'analyze_attendance_patterns', priority: 'medium' }
        );
        break;
      case 'calificaciones':
        suggestions.push(
          { text: 'Registrar nueva calificación', action: 'register_grade', priority: 'high' },
          { text: 'Ver promedios por estudiante', action: 'view_student_averages', priority: 'medium' },
          { text: 'Analizar rendimiento académico', action: 'analyze_academic_performance', priority: 'medium' }
        );
        break;
      case 'boletines':
        suggestions.push(
          { text: 'Generar nuevo boletín', action: 'generate_boletin', priority: 'high' },
          { text: 'Ver boletines existentes', action: 'view_boletines', priority: 'medium' },
          { text: 'Analizar tendencias académicas', action: 'analyze_academic_trends', priority: 'medium' }
        );
        break;
      case 'alertas':
        suggestions.push(
          { text: 'Crear nueva alerta', action: 'create_alert', priority: 'high' },
          { text: 'Ver alertas activas', action: 'view_active_alerts', priority: 'medium' },
          { text: 'Configurar notificaciones', action: 'configure_notifications', priority: 'low' }
        );
        break;
      case 'usuarios':
        suggestions.push(
          { text: 'Crear nuevo usuario', action: 'create_user', priority: 'high' },
          { text: 'Editar perfiles', action: 'edit_profiles', priority: 'medium' },
          { text: 'Gestionar roles y permisos', action: 'manage_roles', priority: 'medium' }
        );
        break;
      case 'mensajes':
        suggestions.push(
          { text: 'Enviar nuevo mensaje', action: 'send_message', priority: 'high' },
          { text: 'Ver conversaciones', action: 'view_conversations', priority: 'medium' },
          { text: 'Gestionar grupos', action: 'manage_groups', priority: 'low' }
        );
        break;
      case 'bot':
        suggestions.push(
          { text: 'Análisis de rendimiento', action: 'performance_analysis', priority: 'high' },
          { text: 'Estadísticas de asistencia', action: 'attendance_stats', priority: 'medium' },
          { text: 'Identificar estudiantes en riesgo', action: 'risk_analysis', priority: 'high' }
        );
        break;
      default:
        suggestions.push(
          { text: 'Ver estadísticas generales', action: 'view_general_stats', priority: 'medium' },
          { text: 'Navegar a módulos', action: 'navigate_modules', priority: 'low' },
          { text: 'Obtener ayuda', action: 'get_help', priority: 'low' }
        );
    }

    return suggestions;
  };

  // Generate contextual responses based on module
  const getContextualResponse = (query: string): string => {
    const input = query.toLowerCase();
    
    switch (context.currentModule) {
      case 'asistencias':
        if (input.includes('registrar') || input.includes('nueva')) {
          return 'Para registrar una nueva asistencia, puedes usar el formulario de registro o el registro rápido. ¿Te gustaría que te guíe en el proceso?';
        } else if (input.includes('reporte') || input.includes('estadística')) {
          return 'Los reportes de asistencia incluyen tasas de presencia, ausencias por materia, y tendencias temporales. ¿Qué tipo de reporte necesitas?';
        }
        break;
      case 'calificaciones':
        if (input.includes('registrar') || input.includes('nueva')) {
          return 'Para registrar una nueva calificación, selecciona el estudiante, la materia y el valor. ¿Necesitas ayuda con algún paso específico?';
        } else if (input.includes('promedio') || input.includes('estadística')) {
          return 'Los promedios se calculan automáticamente y puedes verlos por estudiante, materia o curso. ¿Qué información específica buscas?';
        }
        break;
      case 'boletines':
        if (input.includes('generar') || input.includes('nuevo')) {
          return 'Para generar un nuevo boletín, selecciona el curso y período. El sistema calculará automáticamente los promedios. ¿Quieres proceder?';
        } else if (input.includes('ver') || input.includes('existente')) {
          return 'Los boletines existentes se muestran organizados por curso y período. ¿Qué período te interesa revisar?';
        }
        break;
      case 'alertas':
        if (input.includes('crear') || input.includes('nueva')) {
          return 'Para crear una nueva alerta, define el tipo, destinatarios y mensaje. ¿Qué tipo de alerta necesitas configurar?';
        } else if (input.includes('activa') || input.includes('ver')) {
          return 'Las alertas activas se muestran con su estado y destinatarios. ¿Quieres ver todas las alertas o filtrar por algún criterio?';
        }
        break;
    }

    return 'Entiendo tu consulta. ¿Puedes ser más específico sobre lo que necesitas en este módulo?';
  };

  return {
    context,
    getModuleSuggestions,
    getContextualResponse,
    updateContext: setContext
  };
}; 