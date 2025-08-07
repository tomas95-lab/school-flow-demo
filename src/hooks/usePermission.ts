import { useContext, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import { rolePermissions } from "@/config/roles";

type PermissionKey = keyof (typeof rolePermissions)[keyof typeof rolePermissions];

export function usePermission() {
  const { user } = useContext(AuthContext);
  const role = user?.role as keyof typeof rolePermissions | undefined;

  const permissions = useMemo(() => {
    if (!role) return {} as Record<string, boolean>;
    return rolePermissions[role] as Record<string, boolean>;
  }, [role]);

  const can = (permission: PermissionKey) => {
    return Boolean(permissions[permission as string]);
  };

  return { role, permissions, can };
}


