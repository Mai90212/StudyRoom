const BASE = "http://localhost:8000";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const resp = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    // 如果是 401 错误，清除 token 并跳转到登录页
    if (resp.status === 401) {
      clearToken();
      window.location.href = "/";
    }
    const err = new Error(data.detail || resp.statusText);
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function wsUrl(path) {
  const token = getToken();
  const sep = path.includes("?") ? "&" : "?";
  return token
    ? `${BASE.replace("http", "ws")}${path}${sep}token=${token}`
    : `${BASE.replace("http", "ws")}${path}`;
}
