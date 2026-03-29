import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL,
});

// ...existing code...

// Attach token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stale token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Parse FastAPI error detail (string or pydantic array) into a human-readable message
export function parseApiError(err: any, fallback = "Something went wrong"): string {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const msg = detail[0]?.msg ?? "";
    return msg.replace(/^Value error,\s*/i, "");
  }
  return fallback;
}

export async function login(email: string, password: string) {
  const response = await api.post("/auth/login", { email, password });
  const { access_token } = response.data;
  localStorage.setItem("token", access_token);
  api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  return response.data;
}

export async function signup(name: string, email: string, password: string) {
  const response = await api.post("/auth/signup", { name, email, password });
  const { access_token } = response.data;
  localStorage.setItem("token", access_token);
  api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  return response.data;
}

export async function oauthLogin(email: string, name: string, provider: string) {
  const res = await api.post("/auth/oauth", { email, name, provider });
  const token = res.data.access_token as string;
  localStorage.setItem("token", token);
  return token;
}

export async function fetchStreamingResponse(prompt: string) {
  const response = await fetch(`${api.defaults.baseURL}/api/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body?.getReader();
  if (!reader) {
  throw new Error("No response body");
}
  const decoder = new TextDecoder("utf-8");
  let done = false;
  let result = "";

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      result += chunk;
      console.log(chunk); // Log each chunk for debugging
    }
  }

  return result;
}