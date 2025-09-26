"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { paths } from "@/paths";
import { useUser } from "@/hooks/use-user";

export function GuestGuard({ children }: { children: React.ReactNode }) {
	const { user, isLoading } = useUser();
	const router = useRouter();

	React.useEffect(() => {
		if (!isLoading && user) {
			router.replace(paths.dashboard?.overview ?? "/dashboard");
		}
	}, [user, isLoading, router]);

	// Always render the form while loading or unauthenticated
	return <>{children}</>;
}
