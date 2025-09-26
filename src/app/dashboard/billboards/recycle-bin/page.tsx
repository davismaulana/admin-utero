"use client";

import * as React from "react";
import { listBillboardsRecycleBin, purgeBillboard, restoreBillboard, type BillboardRow } from "@/services/billboards";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import { Alert, Avatar, Box, Chip, IconButton, Snackbar, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";

import { Gate } from "@/components/auth/Gate";
import { ConfirmDialog } from "@/components/common/confirm-dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const fmtDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
const currencyFmt = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});
const getVFValue = (p: unknown) => (p && typeof p === "object" && "value" in (p as any) ? (p as any).value : p);

function resolveImgUrl(u?: string) {
	if (!u) return undefined;
	if (/^(https?:|blob:|data:)/i.test(u)) return u;
	try {
		return new URL(u.replace(/^\/+/, ""), API_BASE + "/").href;
	} catch {
		return undefined;
	}
}

export default function RecycleBinPage() {
	const [rows, setRows] = React.useState<BillboardRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);
	const [totalCount, setTotalCount] = React.useState(0);
	const [search, setSearch] = React.useState("");
	const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "deletedAt", sort: "desc" }]);
	const [toast, setToast] = React.useState<{ msg: string; severity: "success" | "error" } | null>(null);

	// Restore / Purge dialogs
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [toPurge, setToPurge] = React.useState<BillboardRow | null>(null);
	const [purging, setPurging] = React.useState(false);
	const [restoringId, setRestoringId] = React.useState<string | null>(null);

	const fetchData = React.useCallback(async () => {
		setLoading(true);
		try {
			const res = await listBillboardsRecycleBin({
				page: page + 1,
				pageSize,
				search: search || undefined,
			});
			setRows(res.data);
			const total = res.meta?.total ?? res.data.length;
			setRowCount(total);
			setTotalCount(total);
		} catch (e: any) {
			setToast(e?.message ?? "Failed to load recycle bin");
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, search]);

	React.useEffect(() => {
		fetchData().catch(console.error);
	}, [fetchData]);

	const columns: GridColDef<BillboardRow>[] = [
		{
			field: "image",
			headerName: "Image",
			width: 90,
			sortable: false,
			filterable: false,
			renderCell: ({ row }) => {
				const src = resolveImgUrl((row as any).image?.[0]?.url);
				const letter = (row.location?.[0] ?? "B").toUpperCase();
				return (
					<Avatar
						variant="rounded"
						src={src}
						sx={{ width: 48, height: 48 }}
						imgProps={{ crossOrigin: "anonymous", referrerPolicy: "no-referrer" }}
					>
						{letter}
					</Avatar>
				);
			},
		},
		{ field: "location", headerName: "Location", flex: 1.1, minWidth: 220 },
		{
			field: "cityName",
			headerName: "City",
			minWidth: 150,
			valueGetter: (_v, row) => (row as any).city?.name ?? (row as any).cityName ?? "",
		},
		{
			field: "provinceName",
			headerName: "Province",
			minWidth: 170,
			valueGetter: (_v, row) => (row as any).city?.province?.name ?? (row as any).provinceName ?? "",
		},
		{
			field: "categoryName",
			headerName: "Category",
			minWidth: 140,
			valueGetter: (_v, row) => (row as any).category?.name ?? "",
		},
		{ field: "status", headerName: "Status", minWidth: 120 },
		{ field: "mode", headerName: "Mode", minWidth: 90 },
		{
			field: "sellPrice",
			headerName: "Sell",
			minWidth: 120,
			headerAlign: "right",
			align: "right",
			valueFormatter: (p) => {
				const v = getVFValue(p);
				if (v == null || v === "") return "";
				const n = Number(v);
				return Number.isFinite(n) ? currencyFmt.format(n) : String(v);
			},
		},
		{
			field: "servicePrice",
			headerName: "Service",
			minWidth: 120,
			headerAlign: "right",
			align: "right",
			valueFormatter: (p) => {
				const v = getVFValue(p);
				if (v == null || v === "") return "";
				const n = Number(v);
				return Number.isFinite(n) ? currencyFmt.format(n) : String(v);
			},
		},
		{
			field: "deletedAt",
			headerName: "Deleted At",
			minWidth: 180,
			valueFormatter: (p) => {
				const d = new Date(String(p));
				return isNaN(d.getTime()) ? "" : fmtDate.format(d);
			},
		},
		{
			field: "deletedBy",
			headerName: "Deleted By",
			minWidth: 150,
			valueGetter: (_v, row) => (row as any).deletedBy?.username ?? "",
		},
		{
			field: "actions",
			headerName: "Actions",
			width: 150,
			sortable: false,
			filterable: false,
			renderCell: (params) => {
				const restoring = restoringId === params.row.id;
				return (
					<Stack direction="row" spacing={1}>
						<Tooltip title={restoring ? "Restoring..." : "Restore"}>
							<span>
								<IconButton
									size="small"
									color="success"
									disabled={restoring}
									onClick={async () => {
										try {
											setRestoringId(params.row.id);
											await restoreBillboard(params.row.id);
											setToast({ msg: "Billboard restored", severity: "success" });
											await fetchData();
										} catch (e: any) {
											setToast(e?.message ?? "Restore failed");
										} finally {
											setRestoringId(null);
										}
									}}
								>
									<RestoreFromTrashIcon fontSize="small" />
								</IconButton>
							</span>
						</Tooltip>

						<Tooltip title="Purge permanently">
							<IconButton
								size="small"
								color="error"
								onClick={() => {
									setToPurge(params.row);
									setConfirmOpen(true);
								}}
							>
								<DeleteForeverIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</Stack>
				);
			},
		},
	];

	return (
		<Gate allowed={["ADMIN"]}>
			<Box sx={{ p: 2 }}>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					sx={{ mb: 2, gap: 1, flexWrap: "wrap" }}
				>
					<Stack direction="row" spacing={1} alignItems="center">
						<Typography variant="h5">Recycle Bin</Typography>
						<Chip label={`Total: ${totalCount.toLocaleString()}`} size="small" variant="outlined" />
					</Stack>

					<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
						<TextField
							size="small"
							placeholder="Search location/description"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									setPage(0);
									fetchData();
								}
							}}
						/>
					</Stack>
				</Stack>
				<div style={{ height: 600, width: "100%" }}>
					<DataGrid
						rows={rows}
						columns={columns}
						getRowId={(r) => r.id}
						loading={loading}
						pagination
						paginationMode="server"
						rowCount={rowCount}
						paginationModel={{ page, pageSize }}
						onPaginationModelChange={(m) => {
							setPage(m.page);
							setPageSize(m.pageSize);
						}}
						sortingMode="client"
						sortModel={sortModel}
						onSortModelChange={setSortModel}
						pageSizeOptions={[5, 10, 20, 50]}
						disableRowSelectionOnClick
					/>
				</div>
				{/* Purge confirm */}
				<ConfirmDialog
					open={confirmOpen}
					onClose={() => setConfirmOpen(false)}
					title="Permanently delete billboard?"
					content={`This will permanently delete "${
						toPurge?.location ?? "this billboard"
					}" and its related data. This cannot be undone. Continue?`}
					onConfirm={async () => {
						if (!toPurge || purging) return;
						try {
							setPurging(true);
							await purgeBillboard(toPurge.id); // sends ?confirm=true inside service
							setToast({ msg: "Billboard permanently deleted", severity: "success" });
							setConfirmOpen(false);
							setToPurge(null);
							await fetchData();
						} catch (e: any) {
							setToast(e?.message ?? "Failed to purge billboard");
						} finally {
							setPurging(false);
						}
					}}
				/>
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
				</Snackbar>{" "}
			</Box>
		</Gate>
	);
}
