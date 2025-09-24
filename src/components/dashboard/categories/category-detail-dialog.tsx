"use client";

import * as React from "react";
import { getCategoryDetail, type CategoryRow } from "@/services/categories";
import CloseIcon from "@mui/icons-material/Close";
import {
	Avatar,
	Box,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	ImageList,
	ImageListItem,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Paper,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const fmtDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

function resolveImgUrl(u?: string | null) {
	if (!u) return undefined;
	if (/^(https?:|blob:|data:)/i.test(u)) return u;
	try {
		return new URL(String(u).replace(/^\/+/, ""), API_BASE + "/").href;
	} catch {
		return undefined;
	}
}

export function CategoryDetailDialog({ open, id, onClose }: { open: boolean; id: string | null; onClose: () => void }) {
	const [data, setData] = React.useState<CategoryRow | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!open || !id) return;
		let ignore = false;
		(async () => {
			try {
				setLoading(true);
				const d = await getCategoryDetail(id);
				if (!ignore) {
					setData(d);
					setError(null);
				}
			} catch (e: any) {
				if (!ignore) setError(e?.message ?? "Failed to load category");
			} finally {
				if (!ignore) setLoading(false);
			}
		})();
		return () => {
			ignore = true;
		};
	}, [open, id]);

	const titleLetter = (data?.name?.[0] ?? "C").toUpperCase();
	const billboards = data?.billboards ?? [];

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
			<DialogTitle sx={{ pr: 6 }}>
				Category detail
				<Box component="span" sx={{ color: "text.secondary", ml: 1, fontWeight: 400 }}>
					{data?.name ? `• ${data.name}` : ""}
				</Box>
				<Box component="span" sx={{ position: "absolute", right: 8, top: 8 }}>
					<CloseIcon onClick={onClose} sx={{ cursor: "pointer" }} />
				</Box>
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
								<Avatar variant="rounded" sx={{ width: 72, height: 72 }}>
									{titleLetter}
								</Avatar>

								<Stack spacing={0.5} sx={{ flex: 1, width: "100%" }}>
									<Typography variant="h6">{data.name || "(no name)"}</Typography>
									<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
										<Chip size="small" label={`Billboards: ${data.billboardCount ?? billboards.length}`} />
									</Stack>
								</Stack>

								<Stack spacing={0.5} alignItems={{ xs: "flex-start", sm: "flex-end" }} sx={{ minWidth: 220 }}>
									<LabelText label="Created" value={safeDate(data.createdAt)} />
									<LabelText label="Updated" value={safeDate(data.updatedAt)} />
								</Stack>
							</Stack>
						</Paper>

						{/* Billboard preview list (up to 6) */}
						<Paper variant="outlined" sx={{ p: 2 }}>
							<Typography variant="subtitle1" sx={{ mb: 1 }}>
								Billboards in this category ({billboards.length})
							</Typography>

							{!billboards.length ? (
								<Typography color="text.secondary">No billboards under this category.</Typography>
							) : (
								<List dense>
									{billboards.slice(0, 6).map((b) => {
										const img = resolveImgUrl(b.image?.[0]?.url);
										return (
											<ListItem key={b.id} sx={{ px: 0 }}>
												<ListItemAvatar>
													<Avatar
														variant="rounded"
														src={img}
														imgProps={{ crossOrigin: "anonymous", referrerPolicy: "no-referrer" }}
														sx={{ width: 40, height: 40 }}
													>
														{(b.location?.[0] ?? "B").toUpperCase()}
													</Avatar>
												</ListItemAvatar>
												<ListItemText
													primary={b.location || "(no location)"}
													secondary={[b.cityName ?? b.city?.name, b.provinceName ?? b.city?.province?.name]
														.filter(Boolean)
														.join(" • ")}
												/>
											</ListItem>
										);
									})}
								</List>
							)}
						</Paper>

						{/* Optional: category images (if you store any; otherwise omit this block) */}
						{!!(data as any).image?.length && (
							<Paper variant="outlined" sx={{ p: 2 }}>
								<Typography variant="subtitle1" sx={{ mb: 1 }}>
									Images
								</Typography>
								<ImageList cols={3} gap={8}>
									{(data as any).image.map((img: any) => (
										<ImageListItem key={img.id}>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={resolveImgUrl(img.url)}
												alt=""
												loading="lazy"
												crossOrigin="anonymous"
												referrerPolicy="no-referrer"
												style={{ display: "block", width: "100%", height: 180, objectFit: "cover", borderRadius: 8 }}
											/>
										</ImageListItem>
									))}
								</ImageList>
							</Paper>
						)}
					</Stack>
				) : null}
			</DialogContent>
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

function SkeletonBlock() {
	return (
		<Stack spacing={2}>
			<Stack direction="row" spacing={2} alignItems="center">
				<Skeleton variant="rounded" width={72} height={72} />
				<Stack spacing={1} sx={{ flex: 1 }}>
					<Skeleton variant="text" width={220} height={30} />
					<Skeleton variant="text" width={140} />
				</Stack>
				<Stack spacing={1} sx={{ minWidth: 200 }}>
					<Skeleton variant="text" width={120} />
					<Skeleton variant="text" width={120} />
				</Stack>
			</Stack>
			<Divider />
			<Skeleton variant="rounded" height={120} />
		</Stack>
	);
}
