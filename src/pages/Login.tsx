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
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log("Login successful")
    } catch (err: any) {
      console.error("Firebase error:", err.code, err.message)
      setError("Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log("User from context:", user)
    if (user) {
      navigate("/dashboard")
    }
  }, [user, navigate])

  return (
    <div className="grid grid-cols-2 h-screen">
      <div className="flex justify-center items-center flex-col bg-white">
        <img
          src={logo}
          alt="EduFlow Logo"
          className="w-24 "
        />
        <ReutilizableCard
          title="Login"
          description="Please enter your credentials"
          action={
            <Button
              className="w-full mt-4 cursor-pointer"
              variant="info"
              type="submit"
              disabled={loading}
              form="login-form"
            >
              {loading ? "Loading..." : "Login"}
            </Button>
          }
          footer={
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <a href="/register" className="text-blue-500 hover:underline">
                Register
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
              placeholder="Enter your email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
            <input
              type="password"
              className="p-2 border rounded"
              placeholder="Enter your password"
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
        <div className="absolute inset-0 bg-blue-900/30 " />
        <div className="relative z-10 flex flex-col justify-center items-center text-white text-center px-12 h-full animate-fade-in">
          <h1 className="text-4xl font-bold drop-shadow-lg">
            Welcome to <span className="text-yellow-400">EduFlow</span>
          </h1>
          <p className="mt-4 text-lg max-w-md drop-shadow-sm">
            A{" "}
            <span className="text-yellow-400 font-semibold">
              modern platform
            </span>{" "}
            to simplify school management — from{" "}
            <span className="text-yellow-400 font-semibold">grades</span> to{" "}
            <span className="text-yellow-400 font-semibold">smart alerts</span>
            , everything in one place. Powered by{" "}
            <span className="text-yellow-400 font-semibold">AI</span>.
          </p>
        </div>
      </div>
    </div>
  );
}


