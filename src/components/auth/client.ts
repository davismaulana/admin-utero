"use client";
import api from "@/lib/api";
import type { User } from "@/types/user";

export const authClient = {
  async signInWithPassword(body: { identifier: string; password: string }) {
    try {
      await api.post("/auth/login", body);         // cookie set by server
      return { error: null as string | null };
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to sign in";
      return { error: msg };
    }
  },

  async signOut() {
    try {
      await api.post("/auth/logout");
      return { error: null as string | null };
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to sign out";
      return { error: msg };
    }
  },

  async getMe(): Promise<{ data: any | null; error: string | null }> {
    try {
      const res = await api.get<{ user: any }>("/auth/me"); // your Nest endpoint
      return { data: res.data.user ?? null, error: null };
    } catch (e: any) {
      if (e?.response?.status === 401) return { data: null, error: null }; // unauthenticated is NOT an error
      const msg = e?.response?.data?.message || e?.message || "Failed to load session";
      return { data: null, error: msg };
    }
  }
};
