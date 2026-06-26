import { useState, useCallback } from "react";
import { AuthContext } from "./authContextValue";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("qtask_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((user) => {
    localStorage.setItem("qtask_user", JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("qtask_user");
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}