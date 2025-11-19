import { useState, useMemo, useContext } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/firebaseConfig";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { Loader2, Award, User, Calendar, MessageSquare, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useFirestoreCollection } from "@/hooks/useFireStoreCollection";
import { formatDateTime } from "@/utils/dateUtils";
import { AuthContext } from "@/context/AuthContext";

interface Tarea {
  firestoreId: string;
  title: string;
  description?: string;
  points?: number;
  subjectId?: string;
  teacherId?: string;
}

interface Submission {
  firestoreId: string;
  tareaId: string;
  studentId: string;
  comments?: string;
  submittedAt: string;
  status: string;
  grade?: number;
  feedback?: string;
}

interface GradeTareaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea: Tarea;
  onSuccess?: () => void;
}

export function GradeTareaModal({ open, onOpenChange, tarea, onSuccess }: GradeTareaModalProps) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data: submissions } = useFirestoreCollection<Submission>("tarea_submissions", {
    enableCache: true,
    dependencies: [tarea.firestoreId]
  });

  const { data: students } = useFirestoreCollection("students", { enableCache: true });

  const tareaSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter(s => s.tareaId === tarea.firestoreId);
  }, [submissions, tarea.firestoreId]);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > (tarea.points || 100)) {
      toast.error(`La nota debe estar entre 0 y ${tarea.points || 100}`);
      return;
    }

    setLoading(true);

    try {
      const submissionRef = doc(db, "tarea_submissions", selectedSubmission.firestoreId);
      await updateDoc(submissionRef, {
        status: "graded",
        grade: gradeValue,
        feedback: feedback || "",
        gradedAt: new Date().toISOString()
      });

      if (tarea.subjectId) {
        const normalizedGrade = (gradeValue / (tarea.points || 100)) * 10;
        
        await addDoc(collection(db, "calificaciones"), {
          studentId: selectedSubmission.studentId,
          subjectId: tarea.subjectId,
          Actividad: `Tarea: ${tarea.title}`,
          valor: parseFloat(normalizedGrade.toFixed(2)),
          ausente: false,
          fecha: new Date().toISOString(),
          Comentario: feedback || "",
          creadoEn: new Date().toISOString(),
          creadoPor: user?.teacherId || tarea.teacherId || ""
        });
        
        toast.success("Tarea calificada y agregada al registro de calificaciones");
      } else {
        toast.success("Tarea calificada (sin registro en calificaciones - falta materia)");
      }

      setSelectedSubmission(null);
      setGrade("");
      setFeedback("");
      onSuccess?.();
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("Error al calificar la tarea");
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students?.find(s => s.firestoreId === studentId);
    return student ? `${student.nombre} ${student.apellido}` : 'Estudiante';
  };

  if (tareaSubmissions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Entregas de: {tarea.title}</DialogTitle>
            <DialogDescription>
              Aún no hay entregas para esta tarea
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Ningún estudiante ha entregado esta tarea todavía</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (selectedSubmission) {
    return (
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) {
          setSelectedSubmission(null);
          setGrade("");
          setFeedback("");
        }
        onOpenChange(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Calificar Entrega
            </DialogTitle>
            <DialogDescription>
              {getStudentName(selectedSubmission.studentId)} - {tarea.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Entregado: {formatDateTime(selectedSubmission.submittedAt)}</span>
              </div>
              
              {selectedSubmission.comments && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="font-medium">Comentarios del estudiante:</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {selectedSubmission.comments}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">
                Nota * (0 - {tarea.points || 100} puntos)
              </Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max={tarea.points || 100}
                step="0.1"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder={`Ej: ${(tarea.points || 100) * 0.8}`}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback">Retroalimentación (opcional)</Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Comparte comentarios sobre el trabajo del estudiante..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedSubmission(null);
                  setGrade("");
                  setFeedback("");
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Guardar Calificación
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Entregas de: {tarea.title}</DialogTitle>
          <DialogDescription>
            {tareaSubmissions.length} entrega(s) recibida(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {tareaSubmissions.map((submission) => {
            const isGraded = submission.status === 'graded';
            
            return (
              <Card key={submission.firestoreId} className={`${isGraded ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-900">
                          {getStudentName(submission.studentId)}
                        </span>
                        {isGraded && (
                          <Badge className="bg-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Calificada
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        Entregado: {formatDateTime(submission.submittedAt)}
                      </div>

                      {submission.comments && (
                        <div className="text-sm text-gray-700 bg-white p-2 rounded border mb-2">
                          <span className="text-xs text-gray-500">Comentarios: </span>
                          {submission.comments}
                        </div>
                      )}

                      {isGraded && (
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-700">
                              {submission.grade} / {tarea.points || 100}
                            </span>
                          </div>
                          {submission.feedback && (
                            <div className="text-gray-600">
                              {submission.feedback}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      {!isGraded ? (
                        <Button
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Award className="w-3 h-3 mr-1" />
                          Calificar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setGrade(submission.grade?.toString() || "");
                            setFeedback(submission.feedback || "");
                          }}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

