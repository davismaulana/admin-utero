import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { GearSixIcon } from "@phosphor-icons/react/dist/ssr/GearSix";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import { paths } from "@/paths";
import { useProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";
import { authClient } from "@/components/auth/client";
import { SignOutIcon } from "@phosphor-icons/react";


type UserPopoverProps = {
	anchorEl: Element | null;
	open: boolean;
	onClose: () => void;
}

export default function UserPopover({anchorEl, open, onClose}: UserPopoverProps) {
	const router = useRouter();
	const { user, isLoading, checkSession } = useUser();
	const { profile } = useProfile();

	const username = profile?.username || user?.username;
	const email = profile?.email || user?.email;


	if (isLoading) {
		// small skeleton placeholder
		return <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />;
	}

	const handleSignOut = async () => {
		onClose();
		const {error} = await authClient.signOut();
		if (!error) {
			await checkSession?.();
			router.replace("/auth/sign-in");
		} else {
			console.error("Logout failed:", error)
		}
	}

	return (
		<>
			
			<Popover
				anchorEl={anchorEl}
				anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
				onClose={onClose}
				open={open}
				slotProps={{ paper: { sx: { width: "240px" } } }}
			>
				<Box sx={{ p: "16px 20px " }}>
					<Typography variant="subtitle1">{username}</Typography>
					<Typography color="text.secondary" variant="body2">
						{email}
					</Typography>
				</Box>
				<Divider />
				<MenuList disablePadding sx={{ p: "8px", "& .MuiMenuItem-root": { borderRadius: 1 } }}>
					<MenuItem component={RouterLink} href={paths.dashboard.settings} onClick={onClose}>
						<ListItemIcon>
							<GearSixIcon fontSize="var(--icon-fontSize-md)" />
						</ListItemIcon>
						Settings
					</MenuItem>
					<MenuItem component={RouterLink} href={paths.dashboard.account} onClick={onClose}>
						<ListItemIcon>
							<UserIcon fontSize="var(--icon-fontSize-md)" />
						</ListItemIcon>
						Profile
					</MenuItem>
					<MenuItem onClick={handleSignOut}>
					<ListItemIcon>
						<SignOutIcon fontSize="var(--icon-fontSize-md)" />
					</ListItemIcon>
					Sign out
				</MenuItem>
				</MenuList>
			</Popover>
		</>
	);
}
