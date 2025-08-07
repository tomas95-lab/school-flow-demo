import { useContext, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { SchoolSpinner } from "@/components/SchoolSpinner";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function PrivateRoute({ children }: Props) {
  const { user, loading, initialized } = useContext(AuthContext);
  const initialMount = useRef(true);

  useEffect(() => {
    // Después del primer render no volvemos a mostrar el spinner de auth
    initialMount.current = false;
  }, []);

  if (!initialized || (loading && initialMount.current)) {
    return <SchoolSpinner text="Cargando contenido..." fullScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
