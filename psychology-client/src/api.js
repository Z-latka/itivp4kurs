import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  },
);

export const errorMessage = (err, fallback = "Ошибка при запросе к серверу") =>
  err.response
    ? err.response.data?.message || fallback
    : "Сервер недоступен. Проверьте подключение к интернету.";

export const fetchConsultations = (params) => api.get("/consultations", { params });

export const fetchConsultation = (id) => api.get(`/consultations/${id}`);

export const addConsultation = (consultation) =>
  api.post("/consultations", consultation);

export const updateConsultation = (id, updated) =>
  api.put(`/consultations/${id}`, updated);

export const deleteConsultation = (id) => api.delete(`/consultations/${id}`);

export const addReview = (id, review) =>
  api.post(`/consultations/${id}/reviews`, review);

export const updateReview = (id, reviewId, review) =>
  api.patch(`/consultations/${id}/reviews/${reviewId}`, review);

export const fetchLatestReviews = (limit = 3) =>
  api.get("/consultations/reviews/latest", { params: { limit } });

export const fetchSlots = (id, from, to) =>
  api.get(`/consultations/${id}/slots`, { params: { from, to } });

export const login = (credentials) => api.post("/auth/login", credentials);

export const register = (userData) => api.post("/auth/register", userData);

export const fetchProfile = () => api.get("/auth/profile");

export const updateProfile = (data) => api.put("/auth/profile", data);

export const createBooking = (booking) => api.post("/bookings", booking);

export const fetchMyBookings = () => api.get("/bookings/my");

export const cancelBooking = (id) => api.patch(`/bookings/${id}/cancel`);

export const fetchAllBookings = () => api.get("/bookings");

export const setBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status });

export const fetchTests = () => api.get("/tests");

export const fetchTest = (id) => api.get(`/tests/${id}`);

export const submitTest = (id, answers) =>
  api.post(`/tests/${id}/submit`, { answers });

export const fetchMyResults = () => api.get("/tests/results/my");

export const createQuestion = (data) => api.post("/questions", data);

export const fetchMyQuestions = () => api.get("/questions/my");

export const fetchStaffQuestions = (scope) => api.get("/questions", { params: { scope } });

export const assignQuestion = (id) => api.post(`/questions/${id}/assign`);

export const fetchQuestion = (id) => api.get(`/questions/${id}`);

export const sendMessage = (id, text) =>
  api.post(`/questions/${id}/messages`, { text });

export const closeQuestion = (id) => api.patch(`/questions/${id}/close`);

export const fetchStats = () => api.get("/stats");

export const fetchPsychologists = () => api.get("/psychologists");

export const fetchPsychologist = (id) => api.get(`/psychologists/${id}`);

export const adminFetchPsychologists = () => api.get("/admin/psychologists");

export const adminCreatePsychologist = (data) => api.post("/admin/psychologists", data);

export const adminUpdatePsychologist = (id, data) => api.patch(`/admin/psychologists/${id}`, data);

export const fetchAdminStats = () => api.get("/admin/stats");

export const fetchMoods = (days = 30) => api.get("/moods", { params: { days } });

export const fetchFeelings = () => api.get("/moods/feelings");

export const saveMood = (entry) => api.post("/moods", entry);

export const deleteMood = (id) => api.delete(`/moods/${id}`);

export default api;
