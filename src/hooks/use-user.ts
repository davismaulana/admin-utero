"use client";
import * as React from "react";
import { authClient } from "@/components/auth/client";

type UseUser = {
  user: any | null;
  isLoading: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
};

export function useUser(): UseUser {
  const [user, setUser] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchUser = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const me = await authClient.getMe();
      setUser(me ?? null);
    } catch (e: any) {
      // If /auth/me returns 401, we treat as "not logged in"
      if (e?.response?.status === 401) {
        setUser(null);
      } else {
        setError(e?.response?.data?.message || e?.message || "Failed to load user");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    checkSession: fetchUser, // used by your SignInForm after login
  };
}
