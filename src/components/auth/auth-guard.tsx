"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { paths } from "@/paths";
import { useUser } from "@/hooks/use-user";

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const { user, isLoading } = useUser();
	const router = useRouter();
	const pathname = usePathname();

	React.useEffect(() => {
		if (isLoading) return;
		if (!user) router.replace(`${paths.auth.signIn}?next=${encodeURIComponent(pathname || "/")}`);
	}, [user, isLoading, router, pathname]);

	if (isLoading || !user) return null;
	return <>{children}</>;
}
