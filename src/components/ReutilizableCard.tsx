import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ReutilizableCardProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  center?: boolean;
  full?: boolean | string;
}

export function ReutilizableCard({
  title,
  description,
  action,
  children,
  footer,
  center,
  full,
}: ReutilizableCardProps) {
  // Calcula la clase de col-span solo si full está definido y es válido
return (
    <Card className={`${full == true ? "w-full" : full =="login" ? "h-min min-w-100":"w-full h-min" }`}>
      <CardHeader className={`flex flex-col ${center ? "items-center" : "items-start"}`}>
        <CardTitle><h1 className="text-2xl font-bold">{title}</h1></CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        {action && (
          <CardAction className="w-full my-4">
            {action}
          </CardAction>
        )}
      </CardContent>
      {footer && (
        <CardFooter className="flex-col gap-2">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
