import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem("authToken");
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

export async function register(payload) {
  const { data } = await api.post("/api/auth/register", payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post("/api/auth/login", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/api/auth/me");
  return data;
}

export async function ensureUser(email = "demo@example.com") {
  const { data } = await api.post("/api/ensure-user", null, { params: { email } });
  return data;
}

export async function submitProfile(payload) {
  const { data } = await api.post("/api/profile", payload);
  return data;
}

export async function classifyPose(payload) {
  const { data } = await api.post("/api/classify", payload);
  return data;
}

export async function recommendVideos(payload) {
  const { data } = await api.post("/api/recommend", payload);
  return data;
}

export async function chat(payload) {
  const { data } = await api.post("/api/chat", payload);
  return data;
}

export async function logPoseEvent(payload) {
  const { data } = await api.post("/api/pose-log", payload);
  return data;
}
