"use client";
import api from "@/lib/api";

type LoginPayload = { identifier: string; password: string };
type LoginResponse = {
  accessToken?: string;      // if you send tokens in body
  refreshToken?: string;
  user?: { id: string; email?: string; phone?: string; name?: string };
  message?: string;
};

type RegisterPayload = {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

// === choose one mode ===

// A) COOKIE-BASED SESSION (recommended):
// - backend sets httpOnly cookie on /auth/login
// - GET /auth/me returns the current user
export const authClient = {
  async signInWithPassword(body: LoginPayload): Promise<{ error: string | null }> {
    try {
      await api.post<LoginResponse>("/auth/login", body); // sets cookie
      return { error: null };
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to sign in";
      return { error: msg };
    }
  },

  async signUp(body: RegisterPayload): Promise<{ error: string | null }> {
    try {
      await api.post("auth/register", body);
      return { error: null };
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to sign up";
      return { error: msg };
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      await api.post("/auth/logout");
      return { error: null };
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to sign out";
      return { error: msg };
    }
  },

  async getMe() {
    const res = await api.get<{ data: any }>("/user/profile/me");
    return res.data.data;
  }
};
// B) BEARER TOKEN (if you return tokens in body):
// Uncomment this block instead, and in src/lib/api.ts add a request interceptor to attach the token.
/*
export const authClient = {
  async signInWithPassword(body: LoginPayload) {
    const { data } = await api.post<LoginResponse>("/auth/login", body);
    if (!data.accessToken) return { error: "No accessToken in response" };
    localStorage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
    return { error: null as string | null };
  },
  async signOut() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
  async getMe() {
    const { data } = await api.get<{ user: any }>("/auth/me");
    return data.user;
  }
};
*/
