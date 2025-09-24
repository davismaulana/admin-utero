"use client";

import * as React from "react";
import {
	bulkDeleteTransactions,
	fmtDate,
	idrFmt,
	listAllTransactions,
	parseIDR,
	updateTransactionStatus,
	type TransactionRow,
	type TransactionStatus,
} from "@/services/transaction";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
	Alert,
	Box,
	Button,
	Chip,
	IconButton,
	MenuItem,
	Select,
	Snackbar,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import {
	DataGrid,
	type GridColDef,
	type GridRenderCellParams,
	type GridRowSelectionModel,
	type GridSortModel,
} from "@mui/x-data-grid";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { statusColor, TransactionDetailDialog } from "@/components/dashboard/transactions/transaction-detail-dialog";
import { TransactionStatusDialog } from "@/components/dashboard/transactions/transaction-status-dialog";

// status options for filter & editor
const STATUS_OPTIONS: (TransactionStatus | "")[] = [
	"",
	"PENDING",
	"PAID",
	"EXPIRED",
	"REJECTED",
	"CANCELLED",
	"COMPLETED",
];

export default function TransactionsPage() {
	const [rows, setRows] = React.useState<TransactionRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);

	const [search, setSearch] = React.useState("");
	const [status, setStatus] = React.useState<TransactionStatus | "">("");

	const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "createdAt", sort: "desc" }]);

	const [toast, setToast] = React.useState<{ msg: string; severity: "success" | "error" } | null>(null);

	// detail dialog
	const [detailOpen, setDetailOpen] = React.useState(false);
	const [detailId, setDetailId] = React.useState<string | null>(null);

	// bulk delete confirm
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [deleting, setDeleting] = React.useState(false);

	// status edit dialog
	const [editingId, setEditingId] = React.useState<string | null>(null);
	const [editingValue, setEditingValue] = React.useState<TransactionStatus | null>(null);
	const [saving, setSaving] = React.useState(false);

	// selection
	const [selection, setSelection] = React.useState<GridRowSelectionModel>([]);

	const serverSort = React.useMemo(() => {
		const s = sortModel[0];
		if (!s?.field) return { sortBy: "createdAt" as const, sortDir: "desc" as const };
		const allowed = new Set(["createdAt", "updatedAt", "totalPrice", "startDate", "endDate"]);
		const sortBy = allowed.has(s.field) ? (s.field as any) : ("createdAt" as const);
		const sortDir = (s.sort ?? "asc") as "asc" | "desc";
		return { sortBy, sortDir };
	}, [sortModel]);

	const fetchData = React.useCallback(async () => {
		setLoading(true);
		try {
			const res = await listAllTransactions({
				page: page + 1,
				pageSize,
				search: search || undefined,
				status: status || undefined,
				sortBy: serverSort.sortBy,
				sortDir: serverSort.sortDir,
			});
			setRows(res.data);
			const total = res.meta?.total ?? res.data.length;
			setRowCount(total);
		} catch (e: any) {
			setToast(e?.message ?? "Failed to load transactions");
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, search, status, serverSort.sortBy, serverSort.sortDir]);

	React.useEffect(() => {
		fetchData().catch(console.error);
	}, [fetchData]);

	// selected rows (for previewing names)
	const selectedRows = React.useMemo(() => rows.filter((r) => selection.includes(r.id)), [rows, selection]);

	const columns: GridColDef<TransactionRow>[] = [
		{
			field: "billboard",
			headerName: "Billboard",
			flex: 1,
			minWidth: 220,
			renderCell: (params: GridRenderCellParams<TransactionRow>) =>
				params.row.billboard?.location ?? params.row.billboardId,
		},
		{
			field: "buyer",
			headerName: "Buyer",
			minWidth: 180,
			renderCell: (params: GridRenderCellParams<TransactionRow>) =>
				params.row.buyer?.username || params.row.buyer?.email || params.row.buyerId,
		},
		{
			field: "seller",
			headerName: "Seller",
			minWidth: 180,
			renderCell: (params: GridRenderCellParams<TransactionRow>) =>
				params.row.seller?.companyName || params.row.seller?.id,
		},
		{
			field: "totalPrice",
			headerName: "Total",
			minWidth: 140,
			headerAlign: "right",
			align: "right",
			sortable: true,
			renderCell: (params: GridRenderCellParams<TransactionRow>) => {
				const n = parseIDR(params.row.totalPrice as any);
				return n == null ? "" : idrFmt.format(n);
			},
		},
		{
			field: "startDate",
			headerName: "Start",
			minWidth: 170,
			sortable: true,
			renderCell: (params: GridRenderCellParams<TransactionRow>) => formatDate(params.row.startDate),
		},
		{
			field: "endDate",
			headerName: "End",
			minWidth: 170,
			sortable: true,
			renderCell: (params: GridRenderCellParams<TransactionRow>) => formatDate(params.row.endDate),
		},
		{
			field: "status",
			headerName: "Status",
			minWidth: 140,
			renderCell: (params: GridRenderCellParams<TransactionRow>) => (
				<Chip size="small" color={statusColor(params.row.status) as any} label={params.row.status} />
			),
		},
		{
			field: "createdAt",
			headerName: "Created",
			minWidth: 170,
			sortable: true,
			renderCell: (params: GridRenderCellParams<TransactionRow>) => formatDate(params.row.createdAt),
		},
		{
			field: "actions",
			headerName: "Actions",
			width: 120,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<Stack direction="row" spacing={1}>
					<Tooltip title="View">
						<IconButton
							size="small"
							onClick={() => {
								setDetailId(params.row.id);
								setDetailOpen(true);
							}}
						>
							<VisibilityIcon fontSize="small" />
						</IconButton>
					</Tooltip>

					<Tooltip title="Edit status">
						<IconButton
							size="small"
							onClick={() => {
								setEditingId(params.row.id);
								setEditingValue(params.row.status);
							}}
						>
							<EditIcon fontSize="small" />
						</IconButton>
					</Tooltip>

					{/* No per-row delete anymore (bulk-only) */}
				</Stack>
			),
		},
	];

	// Preview string for confirm dialog
	const previewNames = React.useMemo(() => {
		const names = selectedRows.map((r) => r.billboard?.location || "(no location)").filter(Boolean);
		const first = names.slice(0, 3);
		const more = Math.max(0, names.length - first.length);
		return { first, more };
	}, [selectedRows]);

	return (
		<Box sx={{ p: 2 }}>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				sx={{ mb: 2, gap: 1, flexWrap: "wrap" }}
			>
				<Typography variant="h5">Transactions</Typography>

				<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
					<TextField
						size="small"
						placeholder="Search location/city/province/design"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								setPage(0);
								fetchData();
							}
						}}
					/>

					<Select
						size="small"
						value={status}
						onChange={(e) => {
							setStatus(e.target.value as TransactionStatus | "");
							setPage(0);
						}}
						displayEmpty
						sx={{ minWidth: 160 }}
					>
						{STATUS_OPTIONS.map((s) => (
							<MenuItem key={s || "ALL"} value={s}>
								{s || "All statuses"}
							</MenuItem>
						))}
					</Select>

					<Button
						variant="outlined"
						onClick={() => {
							setSearch("");
							setStatus("");
							setPage(0);
							fetchData();
						}}
					>
						Clear filters
					</Button>

					{/* Bulk delete button */}
					<Button
						variant="contained"
						color="error"
						startIcon={<DeleteIcon />}
						disabled={selection.length === 0 || deleting}
						onClick={() => setConfirmOpen(true)}
					>
						Delete selected ({selection.length})
					</Button>
				</Stack>
			</Stack>
			<div style={{ height: 640, width: "100%" }}>
				<DataGrid<TransactionRow>
					rows={rows}
					getRowId={(r) => r.id}
					columns={columns}
					loading={loading}
					pagination
					paginationMode="server"
					rowCount={rowCount}
					paginationModel={{ page, pageSize }}
					onPaginationModelChange={(m) => {
						setPage(m.page);
						setPageSize(m.pageSize);
					}}
					sortingMode="server"
					sortModel={sortModel}
					onSortModelChange={(m) => {
						setSortModel(m);
						setPage(0);
					}}
					pageSizeOptions={[5, 10, 20, 50]}
					checkboxSelection // <-- enable selection
					rowSelectionModel={selection} // <-- controlled selection
					onRowSelectionModelChange={(m) => setSelection(m)}
					disableRowSelectionOnClick
				/>
			</div>
			{/* Detail */}
			<TransactionDetailDialog open={detailOpen} id={detailId} onClose={() => setDetailOpen(false)} />
			{/* Edit status dialog */}
			<TransactionStatusDialog
				open={!!editingId}
				value={editingValue}
				options={STATUS_OPTIONS.filter(Boolean) as TransactionStatus[]}
				saving={saving}
				onClose={() => {
					setEditingId(null);
					setEditingValue(null);
				}}
				onSave={async (next) => {
					if (!editingId) return;
					try {
						setSaving(true);
						await updateTransactionStatus(editingId, next);
						setToast({ msg: "Status updated", severity: "success" });
						setEditingId(null);
						setEditingValue(null);
						await fetchData();
					} catch (e: any) {
						setToast(e?.message || "Failed to update status");
					} finally {
						setSaving(false);
					}
				}}
			/>
			{/* Bulk delete confirm */}
			<ConfirmDialog
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				title="Delete selected transactions"
				content={
					selection.length === 0 ? (
						"No rows selected."
					) : (
						<>
							You are about to delete <b>{selection.length}</b> transactions.
							<br />
							{previewNames.first.length > 0 && (
								<>
									Examples: “{previewNames.first.join("”, “")}”
									{previewNames.more > 0 ? `, and ${previewNames.more} more…` : ""}
								</>
							)}
							<br />
							This cannot be undone.
						</>
					)
				}
				onConfirm={async () => {
					if (selection.length === 0 || deleting) return;
					try {
						setDeleting(true);
						const ids = selection.map(String);
						const res = await bulkDeleteTransactions({ ids }); // bulk API
						setToast({ msg: `Deleted ${res.deleted.transactions} transaction(s).`, severity: "success" });
						setConfirmOpen(false);
						setSelection([]);
						await fetchData();
					} catch (err: any) {
						setToast(err?.message || "Failed to bulk-delete transactions");
					} finally {
						setDeleting(false);
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
	);
}

function formatDate(s?: any) {
	if (!s) return "";
	const d = new Date(String(s));
	return isNaN(d.getTime()) ? "" : fmtDate.format(d);
}
