import { Link, useNavigate } from "react-router-dom";
import loginImage from "../Images/abc4.png";
import "../styles/auth.css";
import { useState } from "react";
import Axios from "../Axios";
import { toast } from "react-toastify";
import useAuth from "../../hooks/useAuth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth(); // Use setAuth instead of setAdmin
  const [user, setUser] = useState({ email: "", password: "", role: "admin" });
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (user.email === "" || user.password === "") {
        toast.error("Please provide email and password");
        setLoading(false);
        return;
      }
      
      const response = await Axios.post("/api/v1/adminLogin", user);
      console.log("Admin login response:", response.data);

      if (response.data.success === true) {
        // Store token WITHOUT "Bearer " prefix (add it in interceptor)
        localStorage.setItem("jwtAdmin", response.data.token);
        localStorage.setItem("adminInfo", JSON.stringify(response.data.user));
        
        // Set auth context if available
        if (setAuth) {
          setAuth({ 
            user: response.data.user, 
            isAdmin: true,
            role: "admin"
          });
        }
        
        toast.success("Login successful. Access granted.");
        navigate("/admin");
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      
      // Safe error handling
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Login failed");
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-div div1">
        <div className="login-box">
          <h1 className="login-heading">Admin Login</h1>
          <h2 className="login-subheading">
            Access the admin dashboard
          </h2>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-div">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                onChange={(e) =>
                  setUser({ ...user, email: e.target.value.trim() })
                }
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="input-div">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={user.password}
                onChange={(e) =>
                  setUser({ ...user, password: e.target.value.trim() })
                }
                name="password"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <div className="forget-button">
            <button onClick={() => console.log("forget password")}>
              Forget password?
            </button>
          </div>
        </div>
      </div>
      <div className="login-div div2">
        <img className="login-image-r" src={loginImage} alt="image" />
      </div>
    </div>
  );
};

export default AdminLogin;