export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("r53_token");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("r53_user");
  return raw ? JSON.parse(raw) : null;
}

export function setSession(token: string, user: User) {
  localStorage.setItem("r53_token", token);
  localStorage.setItem("r53_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("r53_token");
  localStorage.removeItem("r53_user");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
