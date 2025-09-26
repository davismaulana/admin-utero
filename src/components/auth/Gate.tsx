"use client";

import * as React from "react";

import { useUser } from "@/hooks/use-user";

type GateProps = {
	allowed: Array<"ADMIN" | "SELLER" | "BUYER">;
	children: React.ReactNode;
	fallback?: React.ReactNode;
};

export function Gate({ allowed, children, fallback = null }: GateProps) {
	const { user, isLoading } = useUser();

	if (isLoading) return null;
	if (!user) return fallback;
	if (!allowed.includes(user.level)) return fallback;

	return <>{children}</>;
}
