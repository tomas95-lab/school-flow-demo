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
import InscripcionesOverview from "@/components/InscripcionesOverview";
import ReportesInteligentesOverview from "@/components/ReportesInteligentesOverview";
import ExplicacionBoletinOverview from "@/components/ExplicacionBoletinOverview";
import BotOverview from "@/components/BotOverview";
import { PrivateRoute } from "./PrivateRoute";

// import ReportesInteligentesOverview from "@/components/ReportesInteligentesOverview";
// import ExplicacionBoletinOverview from "@/components/ExplicacionBoletinOverview";
// import GeneralOverview from "@/components/GeneralOverview";
// import BotOverview from "@/components/BotOverview";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/asistencias" element={<Asistencias />} />
          <Route path="/app/asistencias/detalles" element={<DetalleAsistencia />} />
          <Route path="/app/calificaciones" element={<Calificaciones />} />
          <Route path="/app/calificaciones/detalles" element={<DetallesCalificaciones />} />
          <Route path="/app/boletines" element={<Boletines />} />
          <Route path="/app/boletines/cursos" element={<BoletinesCurso />} />
          <Route path="/app/alertas" element={<Alertas />} />
          <Route path="/app/usuarios" element={<Usuarios />} />
          <Route path="/app/gestion-cursos-materias" element={<GestionCursosMaterias />} />
          <Route path="/app/test-observaciones" element={<TestObservaciones />} />
          <Route path="/app/mensajes" element={<Mensajes />} />
          <Route path="/app/mensajes/detalles" element={<DetallesMuro />} />
          <Route path="/app/inscripciones" element={<InscripcionesOverview />} />
          <Route path="/app/reportes" element={<ReportesInteligentesOverview />} />
          <Route path="/app/explicacion-boletin" element={<ExplicacionBoletinOverview />} />
          <Route path="/app/bot" element={<BotOverview />} />
          {/* <Route path="/app/reportes" element={<ReportesInteligentesOverview />} />
          <Route path="/app/explicacion-boletin" element={<ExplicacionBoletinOverview />} />
          <Route path="/app/general" element={<GeneralOverview />} />
          <Route path="/app/bot" element={<BotOverview />} /> */}
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}


