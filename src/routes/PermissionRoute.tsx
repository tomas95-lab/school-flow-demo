import type { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import { Navigate } from "react-router-dom";

type PermissionRouteProps = {
  children: ReactNode;
  permission: keyof (typeof import("@/config/roles").rolePermissions)[keyof typeof import("@/config/roles").rolePermissions];
  redirectTo?: string;
};

export function PermissionRoute({ children, permission, redirectTo = "/app/dashboard" }: PermissionRouteProps) {
  const { can } = usePermission();

  if (!can(permission as any)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}


