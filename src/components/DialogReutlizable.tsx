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
    title: ReactNode,
    description?: string,
    content: ReactNode,
    footer?: ReactNode,
    open?: boolean, 
    onOpenChange?: (open: boolean) => void
    background?:boolean,
    small: boolean
}
export default function ReutilizableDialog ({
    triger,
    title,
    description,
    content,
    footer,
    open,
    onOpenChange,
    background,
    small,
}: ReutilizableDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Trigger solo si se pasa */}
            {triger && (
                <DialogTrigger className={`${background ? "bg-primary cursor-pointer text-primary-foreground hover:bg-primary/90": "" } cursor-pointer rounded-md shadow-xs h-9 px-4 py-2 has-[>svg]:px-3`}>
                    {triger}
                </DialogTrigger>
            )}
            <DialogContent small={small} className={`overflow-y-auto overflow-x-hidden`}>
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
