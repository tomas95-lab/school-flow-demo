import { AuthContext } from "../context/AuthContext";
import { useContext} from "react";

export default function Dashboard() {
    const { user, loading } = useContext(AuthContext)
    console.log(user)
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        <p className="text-lg text-gray-700">Welcome to the SchoolFlow Dashboard!</p>
            <h1>{user ? user.name : "Guest"}</h1>
        </div>
    );
}