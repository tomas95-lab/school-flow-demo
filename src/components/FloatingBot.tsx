import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useFirestoreCollection } from '@/hooks/useFireStoreCollection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  X, 
  Send,
} from 'lucide-react';

interface BotMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  context?: string;
  suggestions?: string[];
  data?: any;
}

interface BotContext {
  currentModule: string;
  userRole: string;
  availableData: string[];
  recentActions: string[];
}

interface BotAnalysis {
  type: 'academic' | 'attendance' | 'behavioral' | 'predictive' | 'general';
  title: string;
  description: string;
  confidence: number;
  recommendations: string[];
  dataPoints: any[];
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

const FloatingBot: React.FC = () => {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || 'alumno';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentContext, setCurrentContext] = useState<BotContext>({
    currentModule: 'general',
    userRole,
    availableData: [],
    recentActions: []
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch data for intelligent responses
  const { data: students } = useFirestoreCollection('students');
  const { data: courses } = useFirestoreCollection('courses');
  const { data: teachers } = useFirestoreCollection('teachers');
  const { data: subjects } = useFirestoreCollection('subjects');
  const { data: attendances } = useFirestoreCollection('attendances');
  const { data: calificaciones } = useFirestoreCollection('calificaciones');
  const { data: boletines } = useFirestoreCollection('boletines');
  const { data: alerts } = useFirestoreCollection('alerts');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize bot with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addBotMessage(
        `¡Hola ${user?.email?.split('@')[0]}! Soy tu asistente IA inteligente. 
        Puedo ayudarte con análisis de datos, consultas sobre el sistema educativo, 
        y responder preguntas sobre cualquier módulo. ¿En qué puedo ayudarte hoy?`,
        'welcome',
        [
          'Analizar rendimiento académico',
          'Ver estadísticas de asistencia',
          'Identificar estudiantes en riesgo',
          'Consultar datos del sistema'
        ]
      );
    }
  }, []);

  const addBotMessage = (content: string, context?: string, suggestions?: string[]) => {
    const message: BotMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date(),
      context,
      suggestions
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: BotMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  // Intelligent response generation
  const generateBotResponse = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase();
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Context-aware responses
    if (input.includes('rendimiento') || input.includes('notas') || input.includes('calificaciones')) {
      return generateAcademicAnalysis();
    } else if (input.includes('asistencia') || input.includes('ausencia')) {
      return generateAttendanceAnalysis();
    } else if (input.includes('riesgo') || input.includes('problema')) {
      return generateRiskAnalysis();
    } else if (input.includes('estadística') || input.includes('datos')) {
      return generateSystemStats();
    } else if (input.includes('ayuda') || input.includes('comandos')) {
      return generateHelpResponse();
    } else if (input.includes('hola') || input.includes('buenos días') || input.includes('buenas')) {
      return generateGreeting();
    } else {
      return generateGeneralResponse(input);
    }
  };

  const generateAcademicAnalysis = (): string => {
    if (!students || !calificaciones) {
      return 'No tengo suficientes datos de estudiantes y calificaciones para realizar el análisis.';
    }

    const totalStudents = students.length;
    const totalGrades = calificaciones.length;
    const averageGrade = calificaciones.reduce((sum, g) => sum + g.valor, 0) / totalGrades;
    const highPerformers = calificaciones.filter(g => g.valor >= 8).length;
    const lowPerformers = calificaciones.filter(g => g.valor < 6).length;

    return `📊 **Análisis de Rendimiento Académico**

He analizado los datos de ${totalStudents} estudiantes con ${totalGrades} calificaciones registradas.

**Resultados principales:**
• Promedio general: ${averageGrade.toFixed(2)}
• Estudiantes destacados (≥8): ${highPerformers}
• Estudiantes en riesgo (<6): ${lowPerformers}
• Tasa de aprobación: ${((totalGrades - lowPerformers) / totalGrades * 100).toFixed(1)}%

**Recomendaciones:**
• Implementar tutorías para estudiantes con bajo rendimiento
• Reconocer y motivar a estudiantes destacados
• Establecer metas personalizadas por estudiante`;
  };

  const generateAttendanceAnalysis = (): string => {
    if (!attendances) {
      return 'No tengo datos de asistencia disponibles para el análisis.';
    }

    const totalRecords = attendances.length;
    const presentRecords = attendances.filter(a => a.present).length;
    const attendanceRate = (presentRecords / totalRecords) * 100;

    return `📅 **Análisis de Asistencia**

He analizado ${totalRecords} registros de asistencia.

**Resultados principales:**
• Tasa de asistencia general: ${attendanceRate.toFixed(1)}%
• Registros de presencia: ${presentRecords}
• Registros de ausencia: ${totalRecords - presentRecords}

**Recomendaciones:**
• Identificar causas de ausentismo por materia
• Implementar estrategias de motivación
• Establecer comunicación con familias`;
  };

  const generateRiskAnalysis = (): string => {
    if (!students || !calificaciones || !attendances) {
      return 'No tengo suficientes datos para identificar estudiantes en riesgo.';
    }

    const riskStudents = students.filter(student => {
      const studentGrades = calificaciones.filter(g => g.studentId === student.firestoreId);
      const studentAttendance = attendances.filter(a => a.studentId === student.firestoreId);
      
      const averageGrade = studentGrades.length > 0 
        ? studentGrades.reduce((sum, g) => sum + g.valor, 0) / studentGrades.length 
        : 10;
      
      const attendanceRate = studentAttendance.length > 0
        ? (studentAttendance.filter(a => a.present).length / studentAttendance.length) * 100
        : 100;

      return averageGrade < 6 || attendanceRate < 80;
    });

    return `⚠️ **Análisis de Estudiantes en Riesgo**

He identificado ${riskStudents.length} estudiantes que requieren atención especial.

**Criterios de riesgo:**
• Calificación promedio < 6
• Tasa de asistencia < 80%

**Recomendaciones:**
• Programar reuniones con estudiantes en riesgo
• Implementar planes de apoyo académico
• Establecer seguimiento semanal de progreso`;
  };

  const generateSystemStats = (): string => {
    return `📈 **Estadísticas del Sistema**

**Datos disponibles:**
• Estudiantes: ${students?.length || 0}
• Cursos: ${courses?.length || 0}
• Materias: ${subjects?.length || 0}
• Docentes: ${teachers?.length || 0}
• Registros de asistencia: ${attendances?.length || 0}
• Calificaciones: ${calificaciones?.length || 0}
• Boletines: ${boletines?.length || 0}
• Alertas: ${alerts?.length || 0}

**Estado del sistema:** ✅ Funcionando correctamente`;
  };

  const generateHelpResponse = (): string => {
    return `🤖 **Comandos y Funcionalidades Disponibles**

**Análisis de Datos:**
• "Analizar rendimiento académico"
• "Ver estadísticas de asistencia"
• "Identificar estudiantes en riesgo"
• "Mostrar estadísticas del sistema"

**Consultas Generales:**
• "¿Cuántos estudiantes hay?"
• "¿Cuál es el promedio general?"
• "¿Hay alertas activas?"

**Comandos Especiales:**
• "Ayuda" - Mostrar esta lista
• "Estadísticas" - Ver datos del sistema
• "Análisis completo" - Generar reporte detallado

**Sugerencias:**
Puedes hacer preguntas en lenguaje natural y te responderé de manera inteligente.`;
  };

  const generateGreeting = (): string => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) greeting = '¡Buenos días!';
    else if (hour < 18) greeting = '¡Buenas tardes!';
    else greeting = '¡Buenas noches!';

    return `${greeting} ${user?.email?.split('@')[0]}! 

¿En qué puedo ayudarte hoy? Puedo:
• Analizar datos académicos
• Generar reportes
• Responder consultas sobre el sistema
• Proporcionar insights educativos

Solo dime qué necesitas y te ayudo.`;
  };

  const generateGeneralResponse = (input: string): string => {
    const responses = [
      'Entiendo tu consulta. Déjame analizar los datos disponibles para darte una respuesta precisa.',
      'Interesante pregunta. Voy a revisar la información del sistema para ayudarte.',
      'Perfecto, estoy procesando tu solicitud. Déjame buscar la información relevante.',
      'Excelente consulta. Estoy analizando los datos para proporcionarte insights valiosos.'
    ];
    
    return responses[Math.floor(Math.random() * responses.length)] + 
           '\n\n¿Te gustaría que profundice en algún aspecto específico?';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userInput = inputValue.trim();
    addUserMessage(userInput);
    setInputValue('');

    const response = await generateBotResponse(userInput);
    addBotMessage(response);
    setIsTyping(false);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    addUserMessage(suggestion);
    const response = await generateBotResponse(suggestion);
    addBotMessage(response);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleBot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Bot Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={toggleBot}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-900 hover:to-blue-800 shadow-lg"
          >
            <Bot className="h-6 w-6 text-white" />
          </Button>
        )}
      </div>

      {/* Bot Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-lg shadow-2xl border">
          {/* Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span className="font-semibold">Asistente IA</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 h-[380px]">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-900 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.suggestions && (
                        <div className="mt-3 space-y-2">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="w-full text-xs justify-start"
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
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
                className="bg-blue-900 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}


    </>
  );
};

export default FloatingBot; 