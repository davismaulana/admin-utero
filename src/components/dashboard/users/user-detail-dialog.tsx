"use client";

import * as React from "react";
import { fmtDate, getUserDetail, type UserRow } from "@/services/users";
import CloseIcon from "@mui/icons-material/Close";
import {
	Avatar,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	IconButton,
	Paper,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function resolveImgUrl(u?: string | null) {
	if (!u) return undefined;
	if (/^(https?:|blob:|data:)/i.test(u)) return u;
	try {
		return new URL(String(u).replace(/^\/+/, ""), API_BASE + "/").href;
	} catch {
		return undefined;
	}
}

function maskNumber(n?: string | null, keep = 4) {
	if (!n) return "";
	const s = String(n).replace(/\s+/g, "");
	if (s.length <= keep) return s;
	return s.slice(0, -keep).replace(/./g, "•") + s.slice(-keep);
}

export function UserDetailDialog({ open, id, onClose }: { open: boolean; id: string | null; onClose: () => void }) {
	const [data, setData] = React.useState<UserRow | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!open || !id) return;
		let ignore = false;
		(async () => {
			try {
				setLoading(true);
				const d = await getUserDetail(id);
				if (!ignore) {
					setData(d);
					setError(null);
				}
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

	const avatarUrl = resolveImgUrl(data?.profilePicture);
	const avatarLetter = (data?.username?.[0] ?? "U").toUpperCase();

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
			<DialogTitle sx={{ pr: 6 }}>
				User detail
				<IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent dividers>
				{loading ? (
					<SkeletonBlock />
				) : error ? (
					<Typography color="error">{error}</Typography>
				) : data ? (
					<Stack spacing={2}>
						{/* Header */}
						<Paper variant="outlined" sx={{ p: 2 }}>
							<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
								<Avatar
									src={avatarUrl}
									sx={{ width: 72, height: 72 }}
									imgProps={{ crossOrigin: "anonymous", referrerPolicy: "no-referrer" }}
								>
									{avatarLetter}
								</Avatar>

								<Stack spacing={0.5} sx={{ width: "100%" }}>
									<Typography variant="h6">{data.username}</Typography>
									<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
										<Chip size="small" label={data.email} />
										{data.phone && <Chip size="small" label={maskNumber(data.phone)} />}
										<Chip size="small" label={`Level: ${data.level}`} />
										<Chip size="small" label={`Provider: ${data.provider}`} />
									</Stack>
								</Stack>

								<Stack spacing={0.5} alignItems={{ xs: "flex-start", sm: "flex-end" }} sx={{ minWidth: 220 }}>
									<LabelText label="Created" value={safeDate(data.createdAt)} />
									<LabelText label="Updated" value={safeDate(data.updatedAt)} />
								</Stack>
							</Stack>
						</Paper>

						{/* Meta sections */}
						{data.seller && (
							<Paper variant="outlined" sx={{ p: 2 }}>
								<Typography variant="subtitle1" sx={{ mb: 1 }}>
									Seller profile
								</Typography>
								<Grid container spacing={2}>
									<Field label="Fullname" value={data.seller.fullname} />
									<Field label="Company" value={data.seller.companyName} />
								</Grid>
							</Paper>
						)}

						<Paper variant="outlined" sx={{ p: 2 }}>
							<Typography variant="subtitle1" sx={{ mb: 1 }}>
								Activity
							</Typography>
							<Grid container spacing={2}>
								<Field label="Billboards" value={data.billboard?.length ?? 0} />
								<Field label="Transactions" value={data.transaction?.length ?? 0} />
							</Grid>
						</Paper>
					</Stack>
				) : null}
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose}>Close</Button>
			</DialogActions>
		</Dialog>
	);

	function safeDate(s?: string | null) {
		if (!s) return "-";
		const d = new Date(String(s));
		return isNaN(d.getTime()) ? "-" : fmtDate.format(d);
	}
}

function LabelText({ label, value }: { label: string; value?: React.ReactNode }) {
	return (
		<Stack direction="row" spacing={1} alignItems="center">
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" sx={{ fontWeight: 600 }}>
				{value ?? "-"}
			</Typography>
		</Stack>
	);
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
	return (
		<Grid item xs={12} md={6}>
			<Stack spacing={0.5}>
				<Typography variant="caption" color="text.secondary">
					{label}
				</Typography>
				<Typography variant="body1">{value ?? "-"}</Typography>
			</Stack>
		</Grid>
	);
}

function SkeletonBlock() {
	return (
		<Stack spacing={2}>
			<Stack direction="row" spacing={2} alignItems="center">
				<Skeleton variant="circular" width={72} height={72} />
				<Stack spacing={1} sx={{ flex: 1 }}>
					<Skeleton variant="text" width={220} height={30} />
					<Skeleton variant="text" width={180} />
					<Skeleton variant="rounded" width={320} height={28} />
				</Stack>
			</Stack>
			<Divider />
			<Grid container spacing={2}>
				{Array.from({ length: 6 }).map((_, i) => (
					<Grid item xs={12} md={6} key={i}>
						<Skeleton variant="rounded" height={48} />
					</Grid>
				))}
			</Grid>
		</Stack>
	);
}
