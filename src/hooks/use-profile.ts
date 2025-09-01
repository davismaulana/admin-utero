import { getMyProfile, Profile } from "@/services/profile";
import React from "react";

export function useProfile() {
    const [profile, setProfile] = React.useState<Profile | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let mounted = true;
        getMyProfile()
            .then((p) => mounted && (setProfile(p), setError(null)))
            .catch((e) => mounted && setError(e?.response?.data?.message || e?.message || "Failed to load profile"))
            .finally(() => mounted && setLoading(false));
        return () => {mounted = false}
    }, []);

    return {profile, loading, error};
}