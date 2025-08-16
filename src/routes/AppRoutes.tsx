import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { SchoolSpinner } from "@/components/SchoolSpinner";
import { trackPageView } from "@/services/analytics";
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Layout = lazy(() => import("@/pages/Layout"));
const Asistencias = lazy(() => import("@/pages/Asistencias"));
const DetalleAsistencia = lazy(() => import("@/pages/DetalleAsistencia"));
const Calificaciones = lazy(() => import("@/pages/Calificaciones"));
const DetallesCalificaciones = lazy(() => import("@/pages/DetallesCalificaciones"));
const Boletines = lazy(() => import("@/pages/Boletin"));
const BoletinesCurso = lazy(() => import("@/pages/BoletinesCurso"));
const Alertas = lazy(() => import("@/pages/Alertas"));
const Usuarios = lazy(() => import("@/pages/Usuarios"));
const GestionCursosMaterias = lazy(() => import("@/pages/GestionCursos&Materias"));
const TestObservaciones = lazy(() => import("@/pages/TestObservaciones"));
const Mensajes = lazy(() => import("@/pages/Mensajes"));
const DetallesMuro = lazy(() => import("@/components/DetallesMuro"));
const InscripcionesOverview = lazy(() => import("@/components/InscripcionesOverview"));
const ReportesInteligentesOverview = lazy(() => import("@/components/ReportesInteligentesOverview"));
const ExplicacionBoletinOverview = lazy(() => import("@/components/ExplicacionBoletinOverview"));
const BotOverview = lazy(() => import("@/components/BotOverview"));
const IntervencionesOverview = lazy(() => import("@/components/IntervencionesOverview"));
const Panel360 = lazy(() => import("@/pages/Panel360"));
const Finanzas = lazy(() => import("@/pages/Finanzas"));
const PagoSimulado = lazy(() => import("@/pages/PagoSimulado"));
const Auditoria = lazy(() => import("@/pages/Auditoria"));
const ConfiguracionIAPanel = lazy(() => import("@/components/ConfiguracionIAPanel"));
const ComunicacionFamiliasPanel = lazy(() => import("@/components/ComunicacionFamiliasPanel"));
import { PrivateRoute } from "./PrivateRoute";
import { PermissionRoute } from "./PermissionRoute";

// import ReportesInteligentesOverview from "@/components/ReportesInteligentesOverview";
// import ExplicacionBoletinOverview from "@/components/ExplicacionBoletinOverview";
// import GeneralOverview from "@/components/GeneralOverview";
// import BotOverview from "@/components/BotOverview";

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <PageViewTracker />
      <Suspense fallback={<SchoolSpinner text="Cargando sección..." fullScreen /> }>
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
            <Route
              path="/app/usuarios"
              element={
                <PermissionRoute permission={"canManageUsers"}>
                  <Usuarios />
                </PermissionRoute>
              }
            />
            <Route
              path="/app/gestion-cursos-materias"
              element={
                <PermissionRoute permission={"canManageCourses"}>
                  <GestionCursosMaterias />
                </PermissionRoute>
              }
            />
            <Route path="/app/test-observaciones" element={<TestObservaciones />} />
            <Route path="/app/mensajes" element={<Mensajes />} />
            <Route path="/app/mensajes/detalles" element={<DetallesMuro />} />
            <Route path="/app/inscripciones" element={<InscripcionesOverview />} />
            <Route path="/app/reportes" element={<ReportesInteligentesOverview />} />
            <Route path="/app/explicacion-boletin" element={<ExplicacionBoletinOverview />} />
            <Route path="/app/bot" element={<BotOverview />} />
            <Route path="/app/360" element={<Panel360 />} />
            <Route path="/app/finanzas" element={<Finanzas />} />
            <Route path="/app/pago/:id" element={<PagoSimulado />} />
            <Route path="/app/auditoria" element={<Auditoria />} />
            <Route path="/app/intervenciones" element={<IntervencionesOverview />} />
            <Route 
              path="/app/configuracion-ia" 
              element={
                <PermissionRoute permission={"canManageSettings" as any}>
                  <ConfiguracionIAPanel />
                </PermissionRoute>
              } 
            />
            <Route 
              path="/app/comunicacion-familias" 
              element={
                <PermissionRoute permission={"canManageSettings" as any}>
                  <ComunicacionFamiliasPanel />
                </PermissionRoute>
              } 
            />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}


