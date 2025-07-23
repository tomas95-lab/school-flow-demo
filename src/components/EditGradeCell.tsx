import { useState, useEffect } from "react";
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";
import { useGlobalError } from "@/components/GlobalErrorProvider";
import type { Grade } from "@/types";

interface EditGradeCellProps {
  grade: Grade;
  onUpdate: (updatedGrade: Grade) => void;
}

export default function EditGradeCell({ grade, onUpdate }: EditGradeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(grade.valor?.toString() || "");
  const [loading, setLoading] = useState(false);
  const { handleError } = useGlobalError();

  useEffect(() => {
    setValue(grade.valor?.toString() || "");
  }, [grade.valor]);

  const handleSave = async () => {
    if (value === grade.valor?.toString()) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const db = getFirestore();
      const numericValue = value === "" ? null : parseFloat(value);
      
      if (numericValue !== null && (isNaN(numericValue) || numericValue < 0 || numericValue > 10)) {
        throw new Error("La calificación debe estar entre 0 y 10");
      }

      const updatedGrade: Grade = {
        ...grade,
        valor: numericValue,
        ausente: value === "" || value === "0"
      };

      await updateDoc(doc(db, "calificaciones", grade.firestoreId), {
        valor: numericValue,
        ausente: value === "" || value === "0"
      });

      onUpdate(updatedGrade);
      setIsEditing(false);
    } catch (error) {
      handleError(error, "Actualizar calificación");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(grade.valor?.toString() || "");
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-16 h-8 text-sm"
          disabled={loading}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={loading}
          className="h-6 w-6 p-0"
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={loading}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
      onClick={() => setIsEditing(true)}
    >
      {grade.ausente ? "Ausente" : grade.valor?.toString() || "Sin nota"}
    </div>
  );
} 