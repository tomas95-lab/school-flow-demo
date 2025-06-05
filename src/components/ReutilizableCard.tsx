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
}

export function ReutilizableCard({
  title,
  description,
  action,
  children,
  footer,
}: ReutilizableCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
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
