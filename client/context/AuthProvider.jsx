// client/context/AuthProvider.jsx
import { createContext, useEffect, useState } from "react";
import Axios from "../src/Axios";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setAuth(null);
        setLoading(false);
        return;
      }

      try {
        // Clean token (remove Bearer prefix if present)
        const cleanToken = token.replace(/^Bearer\s+/i, "");
        
        // Verify token with backend
        const response = await Axios.get("/api/v1/verify", {
          headers: {
            Authorization: `Bearer ${cleanToken}`
          }
        });
        
        if (response.data.success) {
          // Set auth with user data
          setAuth({
            user: response.data.user,
            cartSize: response.data.user.cartSize || 0,
            isAuthenticated: true
          });
        } else {
          // Token invalid
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuth(null);
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
export { AuthContext };