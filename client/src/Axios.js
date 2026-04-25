import axios from "axios";

const Axios = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}` || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token
Axios.interceptors.request.use(
  (config) => {
    // For admin routes
    if (config.url.includes("/admin")) {
      let token = localStorage.getItem("jwtAdmin");
      
      if (token) {
        // Clean the token: remove quotes, trim whitespace
        token = token.replace(/["']/g, "").trim();
        
        // Check if token already has 'Bearer ' prefix
        if (token.startsWith("Bearer ")) {
          // Token already has Bearer prefix, use as is
          config.headers.Authorization = token;
        } else {
          // Add Bearer prefix
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log("Authorization header set:", config.headers.Authorization.substring(0, 30) + "...");
      } else {
        console.warn(`No admin token for ${config.url}`);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token errors
Axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("jwtAdmin");
      localStorage.removeItem("adminInfo");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect to login if not already there
      if (window.location.pathname.includes("/admin")) {
        window.location.href = "/adminLogin";
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default Axios;
