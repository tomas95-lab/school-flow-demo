import { useContext, useEffect, useState } from "react";
import { type Auth, signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

import { ReutilizableCard } from "@/components/ReutilizableCard";
import logo from "../assets/media/logo.png";
import backgound from "../assets/media/auth/auth-bg.png";
import { Button } from "@/components/ui/button";
import { AuthContext } from "../context/AuthContext";

async function signInWithEmailAndPassword(auth: Auth, email: string, password: string) {
  return firebaseSignInWithEmailAndPassword(auth, email, password);
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Inicio de sesión exitoso");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error de Firebase:", err.code, err.message);
      
      // Manejar errores específicos de Firebase Auth
      if (err.code === 'auth/user-not-found') {
        setError("No existe una cuenta con este email");
      } else if (err.code === 'auth/wrong-password') {
        setError("Contraseña incorrecta");
      } else if (err.code === 'auth/invalid-email') {
        setError("Formato de email inválido");
      } else if (err.code === 'auth/user-disabled') {
        setError("Esta cuenta ha sido deshabilitada");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Demasiados intentos fallidos. Intenta más tarde");
      } else {
        setError("Error al iniciar sesión. Verifica tus credenciales");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Usuario desde contexto:", user);
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
            {error && <div className="text-red-500 text-sm">{error}</div>}
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
