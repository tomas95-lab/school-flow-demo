import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Eye, CheckCircle, Clock, FileText, AlertCircle } from "lucide-react";
import { BoletinComponent } from "./BoletinComponent";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { updateDoc, doc } from "firebase/firestore";

interface BoletinViewProps {
  row: any;
  trigger?: React.ReactNode;
  showDownloadButton?: boolean;
  onDownload?: () => void;
}

// Función para obtener el estado visual del boletín
const getBoletinStatus = (estado: string, leido?: boolean) => {
  switch (estado) {
    case "generado":
      return {
        icon: FileText,
        label: "Generado",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        description: "Boletín listo para revisar"
      };
    case "leido":
      return {
        icon: CheckCircle,
        label: "Leído",
        color: "bg-green-100 text-green-700 border-green-200",
        description: "Boletín revisado"
      };
    case "abierto":
      return {
        icon: Eye,
        label: "Abierto",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        description: "Disponible para consulta"
      };
    case "cerrado":
      return {
        icon: AlertCircle,
        label: "Cerrado",
        color: "bg-red-100 text-red-700 border-red-200",
        description: "Período finalizado"
      };
    case "pendiente":
    default:
      return {
        icon: Clock,
        label: "Pendiente",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        description: "En proceso de generación"
      };
  }
};

export function BoletinView({ row, trigger, showDownloadButton = false, onDownload }: BoletinViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(row.estado);

  // Marcar como leído cuando se abre el boletín
  const handleOpen = async () => {
    setIsOpen(true);
    
    // Si el boletín no está marcado como leído, marcarlo
    if (row.estado === "generado" || row.estado === "abierto") {
      try {
        // Actualizar en Firestore
        if (row.id) {
          await updateDoc(doc(db, "boletines", row.id), {
            estado: "leido",
            leido: true,
            fechaLectura: new Date().toISOString()
          });
        }
        
        // Actualizar estado local
        setCurrentStatus("leido");
        row.estado = "leido";
        row.leido = true;
        row.fechaLectura = new Date().toISOString();
      } catch (error) {
        console.error("Error al marcar boletín como leído:", error);
      }
    }
  };

  const status = getBoletinStatus(currentStatus, row.leido);
  const Icon = status.icon;

  const defaultTrigger = (
    <div className="inline-flex items-center justify-center p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 cursor-pointer group">
      <div className="flex items-center space-x-2">
        <Eye className="h-4 w-4 text-slate-600 group-hover:text-indigo-600 transition-colors duration-200" />
        <div className="hidden sm:flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            currentStatus === "leido" ? "bg-green-500" :
            currentStatus === "generado" ? "bg-blue-500" :
            currentStatus === "abierto" ? "bg-emerald-500" :
            currentStatus === "cerrado" ? "bg-red-500" :
            "bg-yellow-500"
          }`}></div>
          <span className="text-xs text-gray-500">{status.label}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div onClick={handleOpen}>
          {trigger || defaultTrigger}
        </div>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl p-0 m-4">
        <div className="h-full overflow-y-auto">
          {/* Header con estado del boletín */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${status.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Estado del Boletín</p>
                  <p className="text-xs text-gray-600">{status.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  {row.fechaLectura ? 
                    `Leído: ${new Date(row.fechaLectura).toLocaleDateString('es-ES')}` : 
                    'No leído'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <BoletinComponent row={row} />
          {showDownloadButton && onDownload && (
            <div className="p-4 md:p-6 border-t border-gray-200">
              <Button 
                onClick={onDownload}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Descargar PDF
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}