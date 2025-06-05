import { ReutilizableCard } from "@/components/ReutilizableCard";
import background from "../assets/media/auth/auth-bg.png";
import logo from "../assets/media/logo.png";
import { Button } from "@/components/ui/button";

export default function Login() {
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
          action={<Button className="w-full mt-4">Login</Button>}
          footer={
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <a href="/register" className="text-blue-500 hover:underline">
                Register
              </a>
            </p>
          }
        >
          <form className="flex flex-col gap-8">
            <input
              type="email"
              className="p-2 border rounded"
              placeholder="Enter your email"
              required
            />
            <input
              type="password"
              className="p-2 border rounded"
              placeholder="Enter your password"
              required
            />
          </form>
        </ReutilizableCard>
      </div>

      <div
        className="relative bg-cover bg-center"
        style={{ backgroundImage: `url(${background})` }}
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
