import { useContext, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { rolePermissions } from "@/config/roles";

type PermissionKey = keyof (typeof rolePermissions)[keyof typeof rolePermissions];

export function usePermission() {
  const { user } = useContext(AuthContext);
  const userRole = user?.role;

  const { permissions } = useMemo(() => {
    const validRole = (userRole && userRole in rolePermissions)
      ? (userRole as keyof typeof rolePermissions)
      : undefined;
    const perms = validRole ? rolePermissions[validRole] : ({} as Record<string, boolean>);
    return { permissions: perms as Record<string, boolean> };
  }, [userRole]);

  const can = (permission: PermissionKey) => Boolean((permissions as any)?.[permission as string]);

  return { role: userRole, permissions, can };
}


