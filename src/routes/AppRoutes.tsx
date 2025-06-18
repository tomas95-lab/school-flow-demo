import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Layout from "@/pages/Layout";
import Asistencias from "@/pages/Asistencias";
import DetalleAsistencia from "@/components/DetalleAsistencia";
import Calificaciones from "@/pages/Calificaciones";
import DetallesCalificaciones from "@/pages/DetallesCalificaciones";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/asistencias" element={<Asistencias />} />
          <Route path="/asistencias/:id" element={<DetalleAsistencia />} />
          <Route path="/calificaciones" element={<Calificaciones />} />
          <Route path="/calificaciones/detalles" element={<DetallesCalificaciones />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}


