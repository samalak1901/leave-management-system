import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

interface Props {
    children: JSX.Element;
    role?: "employee" | "manager" | "hr" | "admin";
}

const ProtectedRoute = ({ children, role }: Props) => {
    const { user, isLoading } = useContext(AuthContext);
    console.log(user);

    if (isLoading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (role && user.role !== role) return <Navigate to="/" />;

    return children;
};

export default ProtectedRoute;