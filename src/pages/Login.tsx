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

async function signInWithEmailAndPassword(auth: Auth, email: string, password: string) {
  return firebaseSignInWithEmailAndPassword(auth, email, password);
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
      navigate("/dashboard");
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

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="grid lg:grid-cols-2 md:grid-cols-1 h-screen">
      <div className="flex justify-center items-center flex-col">
        <img
          src={logo}
          alt="Logo de EduFlow"
          className="w-24"
        />
        <ReutilizableCard
          title="Iniciar sesión"
          full="login"
          description="Por favor ingresa tus credenciales"
          action={
            <Button
              className="w-full mt-4 cursor-pointer"
              variant="info"
              type="submit"
              disabled={loading}
              form="login-form"
            >
              {loading ? "Cargando..." : "Iniciar sesión"}
            </Button>
          }
          footer={
            <p className="text-center text-sm text-gray-500">
              ¿No tienes una cuenta?{" "}
              <a href="/register" className="text-blue-500 hover:underline">
                Regístrate
              </a>
            </p>
          }
        >
          <form
            id="login-form"
            className="flex flex-col gap-8"
            onSubmit={handleSubmit}
          >
            <input
              type="email"
              className="p-2 border rounded"
              placeholder="Ingresa tu correo electrónico"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              className="p-2 border rounded"
              placeholder="Ingresa tu contraseña"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />

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
            Bienvenido a <span className="text-yellow-400">EduFlow</span>
          </h1>
          <p className="mt-4 text-lg max-w-md drop-shadow-sm">
            Una{" "}
            <span className="text-yellow-400 font-semibold">
              plataforma moderna
            </span>{" "}
            para simplificar la gestión escolar — desde{" "}
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
