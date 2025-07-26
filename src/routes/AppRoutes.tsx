import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Layout from "@/pages/Layout";
import Asistencias from "@/pages/Asistencias";
import DetalleAsistencia from "@/pages/DetalleAsistencia";
import Calificaciones from "@/pages/Calificaciones";
import DetallesCalificaciones from "@/pages/DetallesCalificaciones";
import Boletines from "@/pages/Boletin";
import BoletinesCurso from "@/pages/BoletinesCurso";
import Alertas from "@/pages/Alertas";
import Usuarios from "@/pages/Usuarios";
import GestionCursosMaterias from "@/pages/GestionCursos&Materias";
import TestObservaciones from "@/pages/TestObservaciones";
import Mensajes from "@/pages/Mensajes";
import DetallesMuro from "@/components/DetallesMuro";

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
          <Route path="/boletines" element={<Boletines />} />
          <Route path="/boletines/cursos" element={<BoletinesCurso />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/gestion-cursos-materias" element={<GestionCursosMaterias />} />
          <Route path="/test-observaciones" element={<TestObservaciones />} />
          <Route path="/mensajes" element={<Mensajes />} />
          <Route path="/mensajes/detalles" element={<DetallesMuro />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}


