"use client";
import * as React from "react";
import { authClient } from "@/components/auth/client";

type UseUser = {
  user: any | null;          // { id, email, level } from /auth/me
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
      const { data, error } = await authClient.getMe(); // returns { data, error }, 401 => {null,null}
      if (error) {
        setUser(null);
        setError(error);
      } else {
        setUser(data ?? null);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load user";
      setUser(null);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      await fetchUser();
      if (!alive) return;
    })();
    return () => {
      alive = false;
    };
  }, [fetchUser]);

  return { user, isLoading, error, checkSession: fetchUser };
}
