"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { updateMyProfile } from "@/services/users";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import {
	Alert,
	Avatar,
	Button,
	Card,
	CardActions,
	CardContent,
	CardHeader,
	CircularProgress,
	Divider,
	FormControl,
	InputLabel,
	OutlinedInput,
	Snackbar,
	Stack,
} from "@mui/material";

import { useProfile } from "@/hooks/use-profile";
import { useUser } from "@/hooks/use-user";

export function UpdateProfileForm(): React.JSX.Element {

	const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

	const { profile, loading: profileLoading } = useProfile();
	const { user, isLoading } = useUser();

	// Local form state (prefilled from profile)
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [file, setFile] = useState<File | null>(null);

	const [submitting, setSubmitting] = useState(false);
	const [toast, setToast] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
	const picturePath = profile?.profilePicture ?? user?.profilePicture ?? null;
	const resolveImgUrl = (u?: string | null) => {
		if (!u) return undefined;
		if (/^(https?:|data:|blob:)/i.test(u)) return u;
		try {
			return new URL(String(u).replace(/^\/+/, ""), API_BASE + "/").href;
		} catch {
			return undefined;
		}
	};
	const avatarUrl = resolveImgUrl(picturePath) ?? "/assets/avatar.png";

	// For selected image preview
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	// Resolve absolute URL for images coming from API

	// Seed fields when profile loads/changes
	useEffect(() => {
		if (!user) return;
		setUsername(user.username ?? "");
		setEmail(user.email ?? "");
		setPhone(user.phone ?? "");
	}, [user]);

	useEffect(() => {
		if (!file) {
			setPreviewUrl(null);
			return;
		}
		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (submitting) return;

		try {
			setSubmitting(true);
			await updateMyProfile({ username, email, phone, file }); // <- service accepts object

			setToast({ msg: "Profile updated", severity: "success" });

			// Give the snackbar a moment, then reload so header/avatar refreshes everywhere
			setTimeout(() => {
				window.location.reload();
			}, 600);
		} catch (err: any) {
			setToast({ msg: err?.message || "Failed to update profile", severity: "error" });
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={onSubmit}>
			<Card>
				<CardHeader subheader="Update your profile info" title="Profile" />
				<Divider />
				<CardContent>
					{profileLoading ? (
						<Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
							<CircularProgress size={24} />
						</Stack>
					) : (
						<Stack spacing={3} sx={{ maxWidth: "sm" }}>
							{/* Avatar + uploader */}
							<Stack direction="row" spacing={2} alignItems="center">
								<Avatar
									src={previewUrl ?? avatarUrl}
									alt={profile?.username || user?.username || "profile"}
									imgProps={{
										crossOrigin: "anonymous",
										referrerPolicy: "no-referrer",
									}}
									// force re-render when the avatar path changes
									key={previewUrl ?? avatarUrl}
									sx={{ width: 64, height: 64, cursor: file ? "default" : "pointer" }}
								/>{" "}
								<Button component="label" variant="outlined" size="small" startIcon={<PhotoCamera />}>
									Change photo
									<input hidden type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
								</Button>
							</Stack>

							{/* Username */}
							<FormControl fullWidth>
								<InputLabel>Username</InputLabel>
								<OutlinedInput label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
							</FormControl>

							{/* Email */}
							<FormControl fullWidth>
								<InputLabel>Email</InputLabel>
								<OutlinedInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
							</FormControl>

							{/* Phone */}
							<FormControl fullWidth>
								<InputLabel>Phone</InputLabel>
								<OutlinedInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
							</FormControl>
						</Stack>
					)}
				</CardContent>
				<Divider />
				<CardActions sx={{ justifyContent: "flex-end" }}>
					<Button type="submit" variant="contained" disabled={submitting || profileLoading}>
						{submitting ? "Saving..." : "Save changes"}
					</Button>
				</CardActions>
			</Card>

			<Snackbar
				open={!!toast}
				autoHideDuration={1800}
				onClose={() => setToast(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				{toast ? (
					<Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
						{toast.msg}
					</Alert>
				) : undefined}
			</Snackbar>
		</form>
	);
}
