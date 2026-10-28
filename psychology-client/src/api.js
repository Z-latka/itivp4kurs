import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Перехватчик запроса: подставляет JWT-токен из localStorage в каждый запрос
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик ответа: обрабатывает ошибки единообразно
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  },
);

export const fetchConsultations = () => api.get("/consultations");

export const addConsultation = (consultation) =>
  api.post("/consultations", consultation);

export const updateConsultation = (id, updated) =>
  api.put(`/consultations/${id}`, updated);

export const deleteConsultation = (id) => api.delete(`/consultations/${id}`);

export const login = (credentials) => api.post("/auth/login", credentials);

export const register = (userData) => api.post("/auth/register", userData);

export default api;
