import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { ReactNode } from "react";

interface ReutilizableDialogProps {
    triger?: ReactNode,
    title: string,
    description?: string,
    content: ReactNode,
    footer?: ReactNode,
    open?: boolean, // NUEVO
    onOpenChange?: (open: boolean) => void // NUEVO
}
export default function ReutilizableDialog ({
    triger,
    title,
    description,
    content,
    footer,
    open,
    onOpenChange
}: ReutilizableDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Trigger solo si se pasa */}
            {triger && (
                <DialogTrigger className="bg-primary cursor-pointer text-primary-foreground rounded-md shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3">
                    {triger}
                </DialogTrigger>
            )}
            <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                {content}
                <DialogFooter>{footer}</DialogFooter>
            </DialogContent>
        </Dialog>
    )
}