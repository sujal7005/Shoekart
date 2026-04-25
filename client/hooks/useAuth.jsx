// client/hooks/useAuth.jsx
import { useContext } from "react";
import AuthContext from "../context/AuthProvider";

const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Always return context, don't throw error
  // This way even if context is not provided, we return default values
  if (!context) {
    console.warn("useAuth must be used within an AuthProvider");
    return { auth: null, setAuth: () => {} };
  }
  
  return context;
};

export default useAuth;