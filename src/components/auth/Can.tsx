"use client";

import * as React from "react";

import type { Permission, Role } from "@/lib/gate";
import { useGate } from "@/hooks/use-gate";

type Props =
	| { perm: Permission; roles?: never; children: React.ReactNode }
	| { perm?: never; roles: Role[] | Role; children: React.ReactNode };

export default function Can({ perm, roles, children }: Props) {
	const gate = useGate();
	const ok = perm ? gate.can(perm) : gate.hasRole(roles!);
	return ok ? <>{children}</> : null;
}
