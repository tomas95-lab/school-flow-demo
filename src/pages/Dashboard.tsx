import { AuthContext } from "../context/AuthContext";
import { useContext} from "react";

export default function Dashboard() {
    const { user, loading } = useContext(AuthContext)
    console.log(user)
    return (
            <h1>{user ? user.name : "Guest"}</h1>
    );
}