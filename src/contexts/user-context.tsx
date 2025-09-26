"use client";

import * as React from "react";

import type { User } from "@/types/user";
import { logger } from "@/lib/default-logger";
import { authClient } from "@/components/auth/client";

export interface UserContextValue {
	user: User | null;
	error: string | null;
	isLoading: boolean;
	checkSession?: () => Promise<void>;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = React.useState<{ user: User | null; error: string | null; isLoading: boolean }>({
		user: null,
		error: null,
		isLoading: true,
	});

	const checkSession = React.useCallback(async (): Promise<void> => {
		try {
			const { data, error } = await authClient.getMe();

			// If there is no session (data === null) and error === null, that's OK.
			if (error) {
				logger.error(error);
				setState((p) => ({ ...p, user: null, error, isLoading: false }));
				return;
			}

			setState((p) => ({ ...p, user: data ?? null, error: null, isLoading: false }));
		} catch (e) {
			// Only unexpected failures should set an error
			logger.error(e);
			setState((p) => ({ ...p, user: null, error: "Failed to check session", isLoading: false }));
		}
	}, []);

	React.useEffect(() => {
		checkSession().catch((e) => logger.error(e));
	}, [checkSession]);

	return <UserContext.Provider value={{ ...state, checkSession }}>{children}</UserContext.Provider>;
}
