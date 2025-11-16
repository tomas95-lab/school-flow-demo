import { useContext, useEffect, useState } from "react";
import { type Auth, signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

import { ReutilizableCard } from "@/components/ReutilizableCard";
import logo from "../assets/media/logo.png";
import backgound from "../assets/media/auth/auth-bg.png";
import { Button } from "@/components/ui/button";
import { AuthContext } from "../context/AuthContext";
import { useGlobalError } from "@/components/GlobalErrorProvider";
import { toast } from "sonner";
import { Play, User, Lock } from "lucide-react";

async function signInWithEmailAndPassword(auth: Auth, email: string, password: string) {
  return firebaseSignInWithEmailAndPassword(auth, email, password);
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { handleError } = useGlobalError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Inicio de sesión exitoso', {
        description: 'Bienvenido de vuelta'
      });
      navigate("/app/dashboard");
    } catch (err) {
      console.error("Error de Firebase:", err);
      
      // Usar el sistema global de manejo de errores
      handleError(err, "Login");
      
      // Mostrar errores con toast
      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code: string };
        if (firebaseError.code === 'auth/user-not-found') {
          toast.error('Usuario no encontrado', {
            description: 'No existe una cuenta con este email'
          });
        } else if (firebaseError.code === 'auth/wrong-password') {
          toast.error('Contraseña incorrecta', {
            description: 'Verifica tu contraseña e intenta de nuevo'
          });
        } else if (firebaseError.code === 'auth/invalid-email') {
          toast.error('Email inválido', {
            description: 'El formato del email no es válido'
          });
        } else if (firebaseError.code === 'auth/user-disabled') {
          toast.error('Cuenta deshabilitada', {
            description: 'Esta cuenta ha sido deshabilitada'
          });
        } else if (firebaseError.code === 'auth/too-many-requests') {
          toast.error('Demasiados intentos', {
            description: 'Demasiados intentos fallidos. Intenta más tarde'
          });
        } else {
          toast.error('Error de inicio de sesión', {
            description: 'Verifica tus credenciales e intenta de nuevo'
          });
        }
      } else {
        toast.error('Error de inicio de sesión', {
          description: 'Verifica tus credenciales e intenta de nuevo'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    
    try {
      // Simular delay de login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Activar modo demo en localStorage
      localStorage.setItem('DEMO_MODE', 'true');
      localStorage.setItem('DEMO_USER', JSON.stringify({
        uid: 'demo-admin-123',
        email: 'demo@schoolflow.com',
        role: 'admin',
        name: 'Usuario Demo',
        teacherId: '',
        studentId: ''
      }));
      
      toast.success('Modo Demo Activado', {
        description: 'Acceso completo al sistema de demostración'
      });
      
      // Recargar la página para activar el modo demo
      window.location.href = '/app/dashboard';
    } catch (error) {
      toast.error('Error al activar modo demo', {
        description: 'Intenta de nuevo'
      });
    } finally {
      setDemoLoading(false);
    }
  };



  useEffect(() => {
    if (user) {
      navigate("/app/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="grid lg:grid-cols-2 md:grid-cols-1 h-screen">
      <div className="flex justify-center items-center flex-col">
        <img
          src={logo}
          alt="Logo de EduNova"
          className="w-24"
        />
        <ReutilizableCard
          title="Iniciar sesión"
          full="login"
          description="Por favor ingresa tus credenciales"
          action={
            <div className="space-y-3">
              <Button
                className="w-full cursor-pointer"
                variant="info"
                type="submit"
                disabled={loading}
                form="login-form"
              >
                {loading ? "Cargando..." : "Iniciar sesión"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o</span>
                </div>
              </div>
              
              <Button
                className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                variant="outline"
                onClick={handleDemoLogin}
                disabled={demoLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                {demoLoading ? "Activando..." : "Ver Demo"}
              </Button>
            </div>
          }
        >
          <form
            id="login-form"
            className="flex flex-col gap-6"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Email
              </label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="admin1@example.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Contraseña
              </label>
              <input
                type="password"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="password123"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
              <strong>Credenciales de prueba:</strong><br />
              Admin: admin1@example.com / password123<br />
              Docente: doc1@example.com / password123<br />
              Alumno: al1@example.com / password123
            </div>

          </form>
        </ReutilizableCard>
      </div>

      <div
        className="relative bg-cover bg-center"
        style={{ backgroundImage: `url(${backgound})` }}
      >
        <div className="absolute inset-0 bg-blue-900/30" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white text-center px-12 h-full animate-fade-in">
          <h1 className="text-4xl font-bold drop-shadow-lg">
            Bienvenido a <span className="text-yellow-400">EduNova</span>
          </h1>
          <p className="mt-4 text-lg max-w-md drop-shadow-sm">
            Una{" "}
            <span className="text-yellow-400 font-semibold">
              plataforma moderna
            </span>{" "}
            para simplificar la gestión escolar desde{" "}
            <span className="text-yellow-400 font-semibold">calificaciones</span>{" "}
            hasta{" "}
            <span className="text-yellow-400 font-semibold">
              alertas inteligentes
            </span>
            , todo en un solo lugar. Impulsado por{" "}
            <span className="text-yellow-400 font-semibold">IA</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
