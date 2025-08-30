import axios from "axios";

const api = axios.create({
  baseURL: "/api", // e.g. https://api.yourdomain.com
  withCredentials: true, // keep it true if your backend sets cookies; false if pure Bearer tokens
});

// Attach token from storage (if you’re using Bearer tokens)
// api.interceptors.request.use((config) => {
//   if (typeof window !== "undefined") {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       config.headers = config.headers ?? {};
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   }
//   return config;
// });

export default api;
