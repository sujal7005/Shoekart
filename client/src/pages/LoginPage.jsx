import { Link, useNavigate } from "react-router-dom";
import loginImage from "../Images/abc4.png";
import "../styles/auth.css";
import { useRef, useState } from "react";
import Axios from "../Axios";
import { toast } from "react-toastify";
import useAuth from "../../hooks/useAuth";

const ForgetPasswordModal = ({ onClose }) => {
  const modelRef = useRef();
  const [email, setEmail] = useState("");
  const closeModal = (e) => {
    if (modelRef.current === e.target) {
      onClose();
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (email === "") {
        toast.error("Please provide email");
        return;
      }
      const response = await Axios.get(`/api/v1/forgetpassword/${email}`);
      if (response.data.success === true) {
        toast.success(response.data.message);
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      console.log(error);
    }
  };
  return (
    <div ref={modelRef} onClick={closeModal} className="modal">
      <div className="modal-container">
        <div className="modal-content">
          <h2 className="login-subheading" style={{ marginTop: "0" }}>
            Forgot Password
          </h2>
          <p
            className="modal-description"
            style={{ color: "#777", margin: "0.5rem 0 0" }}
          >
            Enter your email address below and we'll send you a link to reset
            your password.
          </p>
          <form
            className="login-form"
            onSubmit={handleSubmit}
            style={{ margin: "0" }}
          >
            <div className="input-div">
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="reset-pass-btn">
              <button
                className="login-button"
                type="button"
                style={{ width: "100%", margin: "0" }}
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="login-button"
                style={{ width: "100%", margin: "0" }}
                type="submit" 
              >
                Reset Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [user, setUser] = useState({ email: "", password: "", role: "user" });
  const [showForgetPassword, setShowForgetPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (user.email === "" || user.password === "") {
        toast.error("Please provide email and password", {
          position: "bottom-right",
        });
        setLoading(false);
        return;
      }
      
      const response = await Axios.post("/api/v1/login", user);
      console.log("Login response:", response.data);

      if (response.data.success === true) {
        // Store token WITHOUT "Bearer " prefix (clean token)
        const token = response.data.token;
        const cleanToken = token.replace(/^Bearer\s+/i, "");
        
        // Store in localStorage
        localStorage.setItem("token", cleanToken);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        // Also store in old format for backward compatibility
        localStorage.setItem("jwt", cleanToken);
        
        // Set auth context with user data
        setAuth({
          user: response.data.user,
          cartSize: response.data.user.cartSize || 0,
          isAuthenticated: true
        });
        
        toast.success("Login successful. Access granted.", {
          position: "bottom-right",
        });
        
        // Check if there's a redirect URL saved (from "Add to Cart" redirect)
        const redirectUrl = localStorage.getItem("redirectUrl");
        if (redirectUrl) {
          localStorage.removeItem("redirectUrl");
          navigate(redirectUrl);
        } else {
          navigate("/products");
        }
      } else {
        toast.error(response.data.message || "Login failed", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Something went wrong", {
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-div div1">
        <div className="login-box">
          <h1 className="login-heading">Log in to your account</h1>
          <h2 className="login-subheading">
            Don&apos;t have an account?{" "}
            <Link className="signup-link" to="/signup">
              Sign up
            </Link>
          </h2>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-div">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
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
                onChange={(e) => setUser({ ...user, password: e.target.value })}
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
            <button onClick={() => setShowForgetPassword(true)} type="button">
              Forget password?
            </button>
          </div>
        </div>
      </div>
      <div className="login-div div2">
        <img className="login-image-r" src={loginImage} alt="image" />
      </div>
      {showForgetPassword && (
        <ForgetPasswordModal onClose={() => setShowForgetPassword(false)} />
      )}
    </div>
  );
};

export default LoginPage;