import axios from "axios";

const api = axios.create({
  baseURL: "/api", // e.g. https://api.yourdomain.com
  withCredentials: true, // keep it true if your backend sets cookies; false if pure Bearer tokens
});


export default api;
