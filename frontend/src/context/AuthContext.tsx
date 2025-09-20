import { createContext, useState, ReactNode, useEffect, useContext } from "react";
import axiosClient from "../api/axiosClient";

interface User {
    id: string;
    name: string;
    email: string;
    role: "employee" | "manager" | "hr";
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    accessToken: null,
    refreshToken: null,
    login: async () => { },
    logout: () => { },
    isLoading: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (error) {
                console.error("Failed to parse user from localStorage:", error);
                localStorage.removeItem("user"); 
                return null;
            }
        }
        return null;
    });
    const [accessToken, setAccessToken] = useState<string | null>(
        localStorage.getItem("accessToken")
    );
    const [refreshToken, setRefreshToken] = useState<string | null>(
        localStorage.getItem("refreshToken")
    );
    const [isLoading, setIsLoading] = useState<boolean>(!!accessToken);

    useEffect(() => {
        if (accessToken) {
            axiosClient.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${accessToken}`;
        } else {
            delete axiosClient.defaults.headers.common["Authorization"];
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            axiosClient
                .get("/auth/me")
                .then((res) => {
                    setUser(res.data);
                    localStorage.setItem("user", JSON.stringify(res.data));
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Failed to fetch /me", err);
                    setUser(null);
                    localStorage.removeItem("user");
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
    }, [accessToken]);

    const login = async (email: string, password: string) => {
        const res = await axiosClient.post("/auth/login", { email, password });
        const { accessToken, refreshToken, user } = res.data;

        if (!user || typeof user !== "object") {
            throw new Error("Invalid user data received from login");
        }

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));

        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, refreshToken, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};