import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api`
    : "http://127.0.0.1:5000/api",
});

// Intercept every request before it goes to Flask
api.interceptors.request.use(
  (config) => {
    // 1. ADMIN SECURITY: Attach the admin token if we are logged in
    const token = sessionStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. CART SYSTEM: Attach the cart session ID for the store
    let cartSession = localStorage.getItem("cartSession");
    if (!cartSession) {
      // If a user doesn't have a cart session yet, create a random one
      cartSession = "cart_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("cartSession", cartSession);
    }
    // Send it to Flask as X-Cart-Session (which Flask expects!)
    config.headers["X-Cart-Session"] = cartSession;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
