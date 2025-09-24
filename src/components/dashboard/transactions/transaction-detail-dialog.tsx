"use client";

import * as React from "react";
import { fmtDate, getTransactionDetail, idrFmt, parseIDR, TransactionDetail } from "@/services/transaction";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
	Box,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	IconButton,
	Skeleton,
	Stack,
	Typography,
} from "@mui/material";

export function statusColor(s?: string) {
	switch (s) {
		case "PENDING":
			return "warning";
		case "PAID":
			return "success";
		case "EXPIRED":
			return "default";
		case "REJECTED":
			return "error";
		case "CANCELLED":
			return "default";
		case "COMPLETED":
			return "success";
		default:
			return "default";
	}
}

export function TransactionDetailDialog({
	open,
	id,
	onClose,
}: {
	open: boolean;
	id: string | null;
	onClose: () => void;
}) {
	const [data, setData] = React.useState<TransactionDetail | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (!open || !id) return;
		let ignore = false;

		(async () => {
			try {
				setLoading(true);
				const detail = await getTransactionDetail(id); // ⬅️ use 'detail'
				if (!ignore) {
					setData(detail); // ⬅️ setData(detail)
					setError(null);
				}
			} catch (e: any) {
				if (!ignore) setError(e?.message ?? "Failed to load transaction");
			} finally {
				if (!ignore) setLoading(false);
			}
		})();

		return () => {
			ignore = true;
		};
	}, [open, id]);

	const money = (v?: string | number | null) => {
		const n = parseIDR(v);
		return n == null ? "-" : idrFmt.format(n);
	};
	const date = (s?: string | null) => {
		if (!s) return "-";
		const d = new Date(String(s));
		return isNaN(d.getTime()) ? "-" : fmtDate.format(d);
	};

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
			<DialogTitle sx={{ pr: 6 }}>
				Transaction detail
				<IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent dividers>
				{loading ? (
					<Skeleton height={220} />
				) : error ? (
					<Typography color="error">{error}</Typography>
				) : data ? (
					<Stack spacing={2}>
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
							<Chip icon={<ReceiptLongIcon />} label={`ID: ${data.id}`} size="small" />
							<Chip label={`Status: ${data.status}`} size="small" color={statusColor(data.status) as any} />
							<Chip label={`Total: ${money(data.totalPrice)}`} size="small" />
							<Chip label={`Start: ${date(data.startDate)}`} size="small" />
							<Chip label={`End: ${date(data.endDate ?? undefined)}`} size="small" />
						</Stack>

						<Divider />

						<Grid container spacing={2}>
							<Info label="Buyer" value={data.buyer?.username || data.buyer?.email || data.buyer?.id} />
							<Info label="Seller" value={data.seller?.companyName || data.seller?.id} />
							<Info label="Billboard" value={data.billboard?.location || data.billboard?.id} />
							<Info label="City" value={data.billboard?.cityName} />
							<Info label="Province" value={data.billboard?.provinceName} />
							<Info label="Design" value={data.design?.name} />
							<Info label="Created" value={date(data.createdAt)} />
							<Info label="Updated" value={date(data.updatedAt)} />
						</Grid>

						{!!data.addons?.length && (
							<Box>
								<Typography variant="subtitle1" sx={{ mb: 1 }}>
									Add-ons
								</Typography>
								<Stack direction="row" spacing={1} flexWrap="wrap">
									{data.addons.map((a) => (
										<Chip key={a.id} label={`${a.addOn.name} • ${money(a.addOn.price ?? null)}`} />
									))}
								</Stack>
							</Box>
						)}

						{data.transactionHistory?.pricing && (
							<Box>
								<Typography variant="subtitle1" sx={{ mb: 1 }}>
									Pricing snapshot
								</Typography>
								<pre
									style={{
										margin: 0,
										whiteSpace: "pre-wrap",
										fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
										fontSize: 12,
										border: "1px solid rgba(0,0,0,0.12)",
										borderRadius: 8,
										padding: 12,
									}}
								>
									{JSON.stringify(data.transactionHistory.pricing, null, 2)}
								</pre>
							</Box>
						)}
					</Stack>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

function Info({ label, value }: { label: string; value?: React.ReactNode }) {
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
