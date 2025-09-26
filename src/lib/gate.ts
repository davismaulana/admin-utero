"use client";
import { useUser } from "@/hooks/use-user";
import { useRouter, usePathname } from "next/navigation";
import React from "react";

export function Gate({ allowed, children }: { allowed: Array<"ADMIN" | "SELLER" | "BUYER">; children: React.ReactNode; }) {
    const { user, isLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    React.useEffect(() => {
        if (isLoading) return;
        if (!user) router.replace(`/auth/sign-in?next=${encodeURIComponent(pathname || "/")}`);
        else if (!allowed.includes(user.level)) router.replace("/403");
    }, [user, isLoading, router, pathname, allowed]);

    if (isLoading || !user || !allowed.includes(user.level)) return null;
    return children;
}
