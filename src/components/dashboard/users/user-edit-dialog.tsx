"use client";

import * as React from "react";
import { getUserDetail, updateUser, type UpdateUserInput, type UserRow } from "@/services/users";
import CloseIcon from "@mui/icons-material/Close";
import {
	Alert,
	Avatar,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	IconButton,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const LEVEL_OPTIONS = ["ADMIN", "BUYER", "SELLER"] as const;

function resolveImgUrl(u?: string | null) {
	if (!u) return undefined;
	if (/^(https?:|blob:|data:)/i.test(u)) return u;
	try {
		return new URL(String(u).replace(/^\/+/, ""), API_BASE + "/").href;
	} catch {
		return undefined;
	}
}

export function UserEditDialog({
	open,
	id,
	onClose,
	onSaved,
}: {
	open: boolean;
	id: string | null;
	onClose: () => void;
	onSaved?: (u: UserRow) => void; // notify page to refresh row
}) {
	const [loading, setLoading] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const [initial, setInitial] = React.useState<UserRow | null>(null);

	// form state
	const [username, setUsername] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [phone, setPhone] = React.useState("");
	const [level, setLevel] = React.useState<string>("BUYER");
	const [password, setPassword] = React.useState("");
	const [confirm, setConfirm] = React.useState("");
	const [file, setFile] = React.useState<File | null>(null);
	const [preview, setPreview] = React.useState<string | undefined>(undefined);

	React.useEffect(() => {
		if (!open || !id) return;
		let ignore = false;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const u = await getUserDetail(id);
				if (ignore) return;
				setInitial(u);
				setUsername(u.username || "");
				setEmail(u.email || "");
				setPhone(u.phone || "");
				setLevel(String(u.level || "BUYER"));
				setPassword("");
				setConfirm("");
				setFile(null);
				setPreview(resolveImgUrl(u.profilePicture));
			} catch (e: any) {
				if (!ignore) setError(e?.message ?? "Failed to load user");
			} finally {
				if (!ignore) setLoading(false);
			}
		})();
		return () => {
			ignore = true;
		};
	}, [open, id]);

	const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0];
		if (!f) return;
		setFile(f);
		setPreview(URL.createObjectURL(f));
	};

	const onSubmit = async () => {
		if (!id) return;
		// basic client validations
		if (password && password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}
		if (password && password !== confirm) {
			setError("Password and confirmation do not match.");
			return;
		}
		setError(null);
		setSaving(true);
		try {
			const payload: UpdateUserInput = {
				username: username?.trim(),
				email: email?.trim(),
				phone: phone?.trim(),
				level,
				password: password || undefined,
				confirmPassword: password ? confirm : undefined,
			};
			const updated = await updateUser(id, payload);
			onSaved?.(updated);
			onClose();
		} catch (e: any) {
			setError(e?.message || "Failed to update user");
		} finally {
			setSaving(false);
		}
	};

	const avatarLetter = (username?.[0] ?? "U").toUpperCase();

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle sx={{ pr: 6 }}>
				Edit user
				<IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent dividers>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
					<Avatar
						src={preview}
						sx={{ width: 64, height: 64 }}
						imgProps={{ crossOrigin: "anonymous", referrerPolicy: "no-referrer" }}
					>
						{avatarLetter}
					</Avatar>
					<Stack direction="row" spacing={1} alignItems="center">
						<Button component="label" size="small" variant="outlined">
							Change photo
							<input type="file" hidden accept="image/*" onChange={onPickFile} />
						</Button>
						{file && (
							<Button
								size="small"
								onClick={() => {
									setFile(null);
									setPreview(resolveImgUrl(initial?.profilePicture));
								}}
							>
								Remove
							</Button>
						)}
					</Stack>
				</Stack>

				<Grid container spacing={2}>
					<Grid item xs={12} md={6}>
						<TextField
							label="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							fullWidth
							disabled={loading || saving}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							label="Email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							fullWidth
							disabled={loading || saving}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							label="Phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							fullWidth
							disabled={loading || saving}
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							select
							label="Level"
							value={level}
							onChange={(e) => setLevel(e.target.value)}
							fullWidth
							disabled={loading || saving}
						>
							{LEVEL_OPTIONS.map((lv) => (
								<MenuItem key={lv} value={lv}>
									{lv}
								</MenuItem>
							))}
						</TextField>
					</Grid>

					<Grid item xs={12}>
						<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
							Change password (optional)
						</Typography>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							label="New password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							fullWidth
							disabled={loading || saving}
							placeholder="Leave blank to keep"
						/>
					</Grid>
					<Grid item xs={12} md={6}>
						<TextField
							label="Confirm password"
							type="password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							fullWidth
							disabled={loading || saving}
							placeholder="Repeat new password"
						/>
					</Grid>
				</Grid>
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose} disabled={saving}>
					Cancel
				</Button>
				<Button onClick={onSubmit} disabled={saving} variant="contained">
					{saving ? "Saving…" : "Save"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
