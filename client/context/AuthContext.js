"use client";
import { createContext, useState, useEffect } from "react";
import { logoutUser } from "@/lib/api/auth";
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    // On mount, restore auth state from localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
    }, []);
    function login(user, token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        setToken(token);
    }
    async function logout() {
        try {
            await logoutUser();
        }
        catch {
            // Even if the API call fails, clear local state
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
    }
    return (<AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            login,
            logout,
        }}>
      {children}
    </AuthContext.Provider>);
}
