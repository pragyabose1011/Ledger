import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Attach token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function signup(name: string, email: string, password: string) {
  const res = await api.post("/auth/signup", { name, email, password });
  const token = res.data.access_token as string;
  localStorage.setItem("token", token);
  return token;
}

export async function login(email: string, password: string) {
  const res = await api.post("/auth/login", { email, password });
  const token = res.data.access_token as string;
  localStorage.setItem("token", token);
  return token;
}

export async function oauthLogin(email: string, name: string, provider: string) {
  const res = await api.post("/auth/oauth", { email, name, provider });
  const token = res.data.access_token as string;
  localStorage.setItem("token", token);
  return token;
}