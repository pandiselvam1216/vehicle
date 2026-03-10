import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("anpr_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export const WS_BASE = API_BASE.replace(/^http/, "ws");

// Auth
export const login = (username: string, password: string) => {
  const form = new FormData();
  form.append("username", username);
  form.append("password", password);
  return api.post("/auth/login", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Detections
export const uploadImage = (file: File, cameraId = "upload", location = "") => {
  const form = new FormData();
  form.append("file", file);
  form.append("camera_id", cameraId);
  form.append("location", location);
  return api.post("/detections/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadVideo = (file: File, cameraId = "video", frameSkip = 10) => {
  const form = new FormData();
  form.append("file", file);
  form.append("camera_id", cameraId);
  form.append("frame_skip", String(frameSkip));
  return api.post("/detections/upload-video", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const listDetections = (params?: Record<string, string | number>) =>
  api.get("/detections", { params });

// Search
export const searchPlate = (plate: string, fromDate?: string, toDate?: string) =>
  api.get("/search", { params: { plate, from_date: fromDate, to_date: toDate } });

export const plateHistory = (plateNumber: string) =>
  api.get(`/search/history/${plateNumber}`);

// Analytics
export const getSummary = () => api.get("/analytics/summary");
export const getDailyTraffic = (days = 7) =>
  api.get("/analytics/daily-traffic", { params: { days } });
export const getTopPlates = (limit = 10) =>
  api.get("/analytics/top-plates", { params: { limit } });
export const getByCamera = () => api.get("/analytics/by-camera");

// Alerts
export const getBlacklist = () => api.get("/alerts/blacklist");
export const addToBlacklist = (plateNumber: string, reason?: string) =>
  api.post("/alerts/blacklist", { plate_number: plateNumber, reason });
export const removeFromBlacklist = (plateNumber: string) =>
  api.delete(`/alerts/blacklist/${plateNumber}`);
export const getAlertLogs = (limit = 50) =>
  api.get("/alerts/logs", { params: { limit } });

// Cameras
export const listCameras = () => api.get("/cameras");
