"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
	fmtDate,
	listMyNotifications,
	markAllNotificationsRead,
	markNotificationRead,
	type NotificationRow,
} from "@/services/notification";
import CheckIcon from "@mui/icons-material/Check";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Popover,
	Stack,
	Typography,
} from "@mui/material";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function resolveImgUrl(u?: string | null) {
	if (!u) return undefined;
	if (/^(https?:|data:|blob:)/i.test(u)) return u;
	try {
		return new URL(String(u).replace(/^\/+/, ""), API_BASE + "/").href;
	} catch {
		return undefined;
	}
}

export function NotificationsPopover({
	anchorEl,
	open,
	onClose,
	onUnreadChange,
}: {
	anchorEl: HTMLElement | null;
	open: boolean;
	onClose: () => void;
	onUnreadChange?: () => void;
}) {
	const router = useRouter();
	const [loading, setLoading] = React.useState(true);
	const [items, setItems] = React.useState<NotificationRow[]>([]);
	const [page, setPage] = React.useState(1);
	const [hasMore, setHasMore] = React.useState(true);
	const [marking, setMarking] = React.useState(false);

	const load = React.useCallback(
		async (reset = false) => {
			setLoading(true);
			try {
				const nextPage = reset ? 1 : page;
				const res = await listMyNotifications({ page: nextPage, pageSize: 10 });
				const nextItems = reset ? res.data : [...items, ...res.data];
				setItems(nextItems);

				const pages = res.meta?.pages ?? Math.max(1, Math.ceil((res.meta?.total ?? nextItems.length) / 10));
				setHasMore(nextPage < pages);
				if (reset) setPage(1);
			} finally {
				setLoading(false);
			}
		},
		[page, items]
	);

	React.useEffect(() => {
		if (open) load(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const handleItemClick = async (n: NotificationRow) => {
		if (n.status === "UNREAD") {
			try {
				setMarking(true);
				await markNotificationRead(n.id);
				setItems((prev) =>
					prev.map((it) => (it.id === n.id ? { ...it, status: "READ", readAt: new Date().toISOString() } : it))
				);
				onUnreadChange?.();
			} finally {
				setMarking(false);
			}
		}
		if (n.entity === "TRANSACTION" && n.entityId) {
			router.push(`/dashboard/transactions?open=${encodeURIComponent(n.entityId)}`);
			onClose();
		}
	};

	const handleMarkAll = async () => {
		try {
			setMarking(true);
			await markAllNotificationsRead();
			setItems((prev) =>
				prev.map((it) => (it.status === "UNREAD" ? { ...it, status: "READ", readAt: new Date().toISOString() } : it))
			);
			onUnreadChange?.();
		} finally {
			setMarking(false);
		}
	};

	return (
		<Popover
			open={open}
			onClose={onClose}
			anchorEl={anchorEl}
			anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			transformOrigin={{ vertical: "top", horizontal: "right" }}
			PaperProps={{ sx: { width: 360, maxHeight: 520 } }}
		>
			<Box sx={{ p: 1.5 }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="subtitle1">Notifications</Typography>
					<Button
						size="small"
						startIcon={<MarkEmailReadIcon />}
						onClick={handleMarkAll}
						disabled={marking || items.every((n) => n.status === "READ")}
					>
						Mark all as read
					</Button>
				</Stack>
			</Box>
			<Divider />

			<Box sx={{ px: 1, py: 0 }}>
				{loading && items.length === 0 ? (
					<Stack alignItems="center" justifyContent="center" sx={{ height: 200 }}>
						<CircularProgress size={20} />
					</Stack>
				) : items.length === 0 ? (
					<Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
						No notifications.
					</Typography>
				) : (
					<List dense disablePadding>
						{items.map((n) => {
							const avatarSrc = resolveImgUrl(n.createdBy?.profilePicture);
							const isUnread = n.status === "UNREAD";
							return (
								<React.Fragment key={n.id}>
									<ListItem
										button
										onClick={() => handleItemClick(n)}
										sx={{
											alignItems: "flex-start",
											bgcolor: isUnread ? "action.hover" : undefined,
										}}
										secondaryAction={
											isUnread ? (
												<IconButton
													edge="end"
													size="small"
													aria-label="mark read"
													onClick={(e) => {
														e.stopPropagation(); // prevent ListItem onClick
														handleItemClick(n);
													}}
												>
													<CheckIcon fontSize="small" />
												</IconButton>
											) : null
										}
									>
										<ListItemAvatar>
											<Avatar
												src={avatarSrc}
												alt={n.createdBy?.username || "user"}
												imgProps={{ crossOrigin: "anonymous", referrerPolicy: "no-referrer" }}
											/>
										</ListItemAvatar>

										<ListItemText
											// Let MUI render primary/secondary BUT make secondary container a div (not <p>)
											primary={
												<Stack direction="row" spacing={1} alignItems="center">
													<Typography variant="subtitle2" component="span" noWrap sx={{ flex: 1 }}>
														{n.title}
													</Typography>
													{isUnread && <Chip size="small" color="primary" label="New" />}
												</Stack>
											}
											secondary={
												<>
													<Typography
														variant="body2"
														component="span" // ⬅️ span, not p
														color="text.secondary"
														display="block"
													>
														{n.message}
													</Typography>
													<Typography
														variant="caption"
														component="span" // ⬅️ span, not p
														color="text.secondary"
														display="block"
													>
														{fmtDate.format(new Date(n.createdAt))}
													</Typography>
												</>
											}
											secondaryTypographyProps={{ component: "div" }} // ⬅️ container is div → safe to nest
										/>
									</ListItem>
									<Divider component="li" />
								</React.Fragment>
							);
						})}
					</List>
				)}
			</Box>

			{hasMore && (
				<>
					<Divider />
					<Box sx={{ p: 1.5 }}>
						<Button
							fullWidth
							variant="outlined"
							onClick={async () => {
								const nextPage = page + 1;
								setLoading(true);
								try {
									const res = await listMyNotifications({ page: nextPage, pageSize: 10 });
									setItems((prev) => [...prev, ...res.data]);
									setPage(nextPage);
									const pages = res.meta?.pages ?? nextPage;
									setHasMore(nextPage < pages);
								} finally {
									setLoading(false);
								}
							}}
						>
							{loading ? "Loading…" : "Load more"}
						</Button>
					</Box>
				</>
			)}
		</Popover>
	);
}
