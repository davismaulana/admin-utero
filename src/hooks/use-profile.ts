"use client";

import * as React from "react";
import { getMyProfile, type Profile } from "@/services/profile";
import { useUser } from "@/hooks/use-user";

export function useProfile() {
    const { user, isLoading: userLoading } = useUser();
    const [profile, setProfile] = React.useState<Profile | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let mounted = true;

        // Not authenticated → clear and stop
        if (userLoading) {
            setLoading(true);
            return;
        }
        if (!user) {
            if (mounted) {
                setProfile(null);
                setError(null);
                setLoading(false);
            }
            return;
        }

        // Authenticated → fetch profile
        (async () => {
            try {
                setLoading(true);
                const p = await getMyProfile();
                if (mounted) {
                    setProfile(p);
                    setError(null);
                }
            } catch (e: any) {
                if (mounted) {
                    const msg = e?.response?.data?.message || e?.message || "Failed to load profile";
                    setProfile(null);
                    setError(msg);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [user, userLoading]); // 👈 refetch when user becomes available

    return { profile, loading, error };
}
