import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { BoletinComponent } from "./BoletinComponent";
import { Button } from "./ui/button";

interface BoletinViewProps {
  row: any;
  trigger?: React.ReactNode;
  showDownloadButton?: boolean;
  onDownload?: () => void;
}

export function BoletinView({ row, trigger, showDownloadButton = false, onDownload }: BoletinViewProps) {
  const defaultTrigger = (
    <div className="inline-flex items-center justify-center p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200 cursor-pointer group">
      <Eye className="h-4 w-4 text-slate-600 group-hover:text-indigo-600 transition-colors duration-200" />
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl p-0 m-4">
        <div className="h-full overflow-y-auto">
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