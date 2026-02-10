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
  try {
    const res = await api.post("/auth/login", { email, password });
    const token = res.data.access_token as string;
    localStorage.setItem("token", token);
    return token;
  } catch (error) {
    console.error("Login failed:", error);
    throw new Error("Failed to log in. Please check your credentials.");
  }
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