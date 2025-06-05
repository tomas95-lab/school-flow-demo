import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function PrivateRoute({ children }: Props) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
