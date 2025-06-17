
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
    triger:string,
    title: string,
    description?: string,
    content: ReactNode
    footer?: ReactNode,
}
export default function ReutilizableDialog ({triger,title,description,content,footer}:ReutilizableDialogProps) {
    return(
            <Dialog>
                <DialogTrigger className="bg-primary cursor-pointer text-primary-foreground rounded-md shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3">{triger}</DialogTrigger>
                <DialogContent>
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