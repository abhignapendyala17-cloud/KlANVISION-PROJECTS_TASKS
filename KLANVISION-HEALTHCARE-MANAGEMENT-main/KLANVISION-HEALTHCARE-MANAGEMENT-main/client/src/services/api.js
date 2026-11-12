import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("healthcare-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    if (
      error.response?.status === 401 &&
      !["/auth/login", "/auth/register", "/auth/logout"].includes(requestUrl)
    ) {
      localStorage.removeItem("healthcare-token");
      localStorage.removeItem("healthcare-user");
      window.dispatchEvent(new Event("healthcare:session-expired"));
    }
    return Promise.reject(error);
  }
);

export function errorMessage(error) {
  return error.response?.data?.message || error.message || "Something went wrong. Please try again.";
}

export default api;
