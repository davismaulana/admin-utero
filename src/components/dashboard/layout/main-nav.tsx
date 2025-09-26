// main-nav.tsx
"use client";

import * as React from "react";
// import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
// import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
// import { UsersIcon } from "@phosphor-icons/react/dist/ssr/Users";

import { getUnreadCount } from "@/services/notification";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";

import { usePopover } from "@/hooks/use-popover";
import { useProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";
import { NotificationsPopover } from "@/components/notifications/notifications-popover";
import { NotificationsToaster } from "@/components/notifications/notifications-toaster";

import { MobileNav } from "./mobile-nav";
import UserPopover from "./user-popover";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

// Safely resolve relative file paths from the API into absolute URLs
function resolveImgUrl(u?: string | null) {
	if (!u) return undefined;
	if (/^(https?:|data:|blob:)/i.test(u)) return u;
	try {
		return new URL(String(u).replace(/^\/+/, ""), API_BASE + "/").href;
	} catch {
		return undefined;
	}
}

export function MainNav(): React.JSX.Element {
	const [openNav, setOpenNav] = React.useState(false);
	const userPopover = usePopover<HTMLDivElement>();

	// This is where you "use" /auth/me indirectly
	const { user } = useUser();
	const { profile } = useProfile();

	const notifBtnRef = React.useRef<HTMLButtonElement | null>(null);
	const [notifOpen, setNotifOpen] = React.useState(false);
	const [unread, setUnread] = React.useState<number>(0);

	React.useEffect(() => {
		if (!user) return; // 👈 only when logged-in
		let mounted = true;

		const load = async () => {
			try {
				const c = await getUnreadCount();
				if (mounted) setUnread(c);
			} catch {}
		};
		load();
		const t = setInterval(load, 60000);
		return () => {
			mounted = false;
			clearInterval(t);
		};
	}, [user]); // 👈 depend on user

	const refreshUnread = React.useCallback(async () => {
		if (!user) return; // 👈 guard refresher too
		try {
			const c = await getUnreadCount();
			setUnread(c);
		} catch {}
	}, [user]);

	const picturePath = profile?.profilePicture ?? user?.profilePicture ?? null; // user.profilePicture will be undefined (expected)
	const avatarUrl = user ? (resolveImgUrl(picturePath) ?? "/assets/avatar.png") : "/assets/avatar.png";

	return (
		<>
			<Box
				component="header"
				sx={{
					borderBottom: "1px solid var(--mui-palette-divider)",
					backgroundColor: "var(--mui-palette-background-paper)",
					position: "sticky",
					top: 0,
					zIndex: "var(--mui-zIndex-appBar)",
				}}
			>
				<Stack
					direction="row"
					spacing={2}
					sx={{ alignItems: "center", justifyContent: "space-between", minHeight: "64px", px: 2 }}
				>
					<Stack sx={{ alignItems: "center" }} direction="row" spacing={2}>
						{/* left side (hamburger/search) optional */}
					</Stack>

					<Stack sx={{ alignItems: "center" }} direction="row" spacing={2}>
						<Tooltip title="Notifications">
							<span>
								<Badge badgeContent={unread} color="error" max={99} overlap="circular" invisible={unread <= 0}>
									<IconButton ref={notifBtnRef} onClick={() => setNotifOpen(true)} aria-label="open notifications">
										<BellIcon />
									</IconButton>
								</Badge>
							</span>
						</Tooltip>

						<Avatar
							onClick={userPopover.handleOpen}
							ref={userPopover.anchorRef}
							src={avatarUrl}
							alt={profile?.username || user?.username || "profile"}
							imgProps={{ crossOrigin: "anonymous", referrerPolicy: "no-referrer" }}
							key={avatarUrl} // refresh when image path changes
							sx={{ cursor: "pointer" }}
						/>
					</Stack>

					<NotificationsPopover
						open={notifOpen}
						anchorEl={notifBtnRef.current}
						onClose={() => setNotifOpen(false)}
						onUnreadChange={refreshUnread}
					/>
					<NotificationsToaster onUnreadRefresh={refreshUnread} />

					<UserPopover
						anchorEl={userPopover.anchorRef.current}
						onClose={userPopover.handleClose}
						open={userPopover.open}
					/>

					<MobileNav onClose={() => setOpenNav(false)} open={openNav} />
				</Stack>
			</Box>
		</>
	);
}
