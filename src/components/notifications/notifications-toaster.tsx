"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
	getUnreadCount,
	listMyNotifications,
	markNotificationRead,
	type NotificationRow,
} from "@/services/notification";
import { Alert, Snackbar } from "@mui/material";

export function NotificationsToaster({
	pollMs = 10000,
	onUnreadRefresh,
}: {
	/** how often to poll for new notifications (ms) */
	pollMs?: number;
	/** call this to refresh any unread badges in the nav */
	onUnreadRefresh?: () => void;
}) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [item, setItem] = React.useState<NotificationRow | null>(null);
	const prevCountRef = React.useRef<number>(0);

	React.useEffect(() => {
		let mounted = true;

		const tick = async () => {
			try {
				const count = await getUnreadCount();
				if (!mounted) return;

				const prev = prevCountRef.current;
				// only pop when the count increased (new unread landed)
				if (count > prev) {
					// fetch the latest notification
					const res = await listMyNotifications({ page: 1, pageSize: 1 });
					const latest = res.data[0];

					// only toast for TRANSACTION creations (tweak if you want more)
					if (latest && latest.entity === "TRANSACTION") {
						setItem(latest);
						setOpen(true);
					}
				}

				prevCountRef.current = count;
				onUnreadRefresh?.(); // let the nav badge update
			} catch {
				// swallow errors to keep UI smooth
			}
		};

		// run once immediately, then poll
		tick();
		const id = setInterval(tick, pollMs);
		return () => {
			mounted = false;
			clearInterval(id);
		};
	}, [pollMs, onUnreadRefresh]);

	const go = async () => {
		if (!item) return;
		try {
			// optimistically mark read
			await markNotificationRead(item.id);
			onUnreadRefresh?.();
		} catch {
			// ignore errors
		} finally {
			// deep-link to the transaction detail page (adjust route if needed)
			if (item.entity === "TRANSACTION" && item.entityId) {
				router.push(`/dashboard/transactions?open=${encodeURIComponent(item.entityId)}`);
			}
			setOpen(false);
		}
	};

	return (
		<Snackbar
			open={open}
			autoHideDuration={5000}
			onClose={() => setOpen(false)}
			// ⬇️ render above everything and away from the grid footer
			anchorOrigin={{ vertical: "top", horizontal: "right" }}
			sx={{ zIndex: (t) => t.zIndex.tooltip + 1 }}
			// (optional) force portal to <body>, guards SSR
		>
			<Alert
				onClick={go}
				onClose={() => setOpen(false)}
				severity="info"
				variant="filled"
				sx={{ width: "100%", cursor: "pointer" }}
			>
				{item ? `${item.title}: ${item.message}` : "New notification"}
			</Alert>
		</Snackbar>
	);
}
