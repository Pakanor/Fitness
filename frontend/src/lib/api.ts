const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return res.json()
  }
  return res.text()
}

export const authApi = {
  register: (data: any) => apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => apiFetch("/api/auth/logout", { method: "POST" }),
  me: () => apiFetch("/api/auth/me"),
}

export const userApi = {
  profile: () => apiFetch("/api/user/profile"),
  updateProfile: (data: any) => apiFetch("/api/user/profile", { method: "PUT", body: JSON.stringify(data) }),
}
