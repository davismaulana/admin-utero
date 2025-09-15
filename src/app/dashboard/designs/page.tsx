"use client";

import * as React from "react";
import { createDesign, deleteDesign, listDesigns, updateDesign, type DesignRow } from "@/services/designs";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Avatar, Box, Button, Chip, IconButton, Snackbar, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DesignFormDialog } from "@/components/dashboard/designs/design-form-dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function resolveImgUrl(u?: string) {
	if (!u) return undefined;
	if (/^(https?:|blob:|data:)/i.test(u)) return u;
	try {
		return new URL(u.replace(/^\/+/, ""), API_BASE + "/").href;
	} catch {
		return undefined;
	}
}

export default function DesignsPage() {
	const [rows, setRows] = React.useState<DesignRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);
	const [totalCount, setTotalCount] = React.useState(0);
	const [search, setSearch] = React.useState("");
	const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "createdAt", sort: "desc" }]);
	const [toast, setToast] = React.useState<string | null>(null);

	const [formOpen, setFormOpen] = React.useState(false);
	const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
	const [formError, setFormError] = React.useState<string | null>(null);
	const [editing, setEditing] = React.useState<DesignRow | null>(null);

	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [toDelete, setToDelete] = React.useState<DesignRow | null>(null);

	const fmt = new Intl.DateTimeFormat("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
	});

	const currencyFmt = new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	});

	// Safely extract the value regardless of how MUI calls valueFormatter
	const getVFValue = (p: unknown) => (p && typeof p === "object" && "value" in (p as any) ? (p as any).value : p);

	const fetchData = React.useCallback(async () => {
		setLoading(true);
		const res = await listDesigns({
			page: page + 1,
			pageSize,
			search: search || undefined,
		});
		setRows(res.data);
		const total = res.meta?.total ?? res.data.length;
		setRowCount(total);
		setTotalCount(total);
		setLoading(false);
	}, [page, pageSize, search]);

	React.useEffect(() => {
		fetchData().catch(console.error);
	}, [fetchData]);

	const columns: GridColDef<DesignRow>[] = [
		{
			field: "image",
			headerName: "Image",
			width: 90,
			sortable: false,
			filterable: false,
			renderCell: ({ row }) => {
				const firstUrl = row.image?.[0]?.url as string | undefined;
				const src = resolveImgUrl(firstUrl);
				const letter = (row.name?.[0] ?? "D").toUpperCase();

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
		{ field: "name", headerName: "Name", flex: 1, minWidth: 200 },
		{ field: "description", headerName: "Description", flex: 1.5, minWidth: 260 },
		{
			field: "price",
			headerName: "Price",
			minWidth: 140,
			headerAlign: "right",
			align: "right",
			valueFormatter: (p) => {
				const v = getVFValue(p);
				if (v === undefined || v === null || v === "") return "";
				const n = Number(v);
				// If it's not a number, just show the raw string
				if (!Number.isFinite(n)) return String(v);
				return currencyFmt.format(n); // e.g., Rp351
			},
		},
		{
			field: "createdAt",
			headerName: "Created",
			minWidth: 180,
			valueFormatter: (p) => {
				const d = new Date(String(p));
				return isNaN(d.getTime()) ? "" : fmt.format(d);
			},
		},
		{
			field: "actions",
			headerName: "Actions",
			width: 140,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<Stack direction="row" spacing={1}>
					<Tooltip title="View">
						<IconButton size="small" onClick={() => alert(JSON.stringify(params.row, null, 2))}>
							<VisibilityIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title="Edit">
						<IconButton
							size="small"
							onClick={() => {
								setEditing(params.row);
								setFormMode("edit");
								setFormOpen(true);
							}}
						>
							<EditIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title="Delete">
						<IconButton
							size="small"
							color="error"
							onClick={() => {
								setToDelete(params.row);
								setConfirmOpen(true);
							}}
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				</Stack>
			),
		},
	];

	return (
		<Box sx={{ p: 2 }}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
				<Stack direction="row" spacing={1} alignItems="center">
					<Typography variant="h5">Designs</Typography>
					<Chip label={`Total: ${totalCount.toLocaleString()}`} size="small" variant="outlined" />
				</Stack>

				<Stack direction="row" spacing={1}>
					<TextField
						size="small"
						placeholder="Search name/description"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								setPage(0);
								fetchData();
							}
						}}
					/>
					<Button
						variant="contained"
						onClick={() => {
							setPage(0);
							fetchData();
						}}
					>
						Search
					</Button>
					<Button
						variant="outlined"
						onClick={() => {
							setEditing(null);
							setFormMode("create");
							setFormOpen(true);
						}}
					>
						Add design
					</Button>
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
					// Sorting client-side unless backend supports it
					sortingMode="client"
					sortModel={sortModel}
					onSortModelChange={setSortModel}
					pageSizeOptions={[5, 10, 20, 50]}
					disableRowSelectionOnClick
				/>
			</div>

			{/* Create / Edit */}
			<DesignFormDialog
				open={formOpen}
				mode={formMode}
				initial={
					editing
						? {
								name: editing.name,
								description: editing.description,
								price: editing.price,
							}
						: undefined
				}
				serverError={formError}
				onClose={() => setFormOpen(false)}
				onSubmit={async (vals) => {
					try {
						setFormError(null);
						if (formMode === "create") {
							await createDesign({
								name: vals.name,
								description: vals.description,
								price: vals.price,
								images: vals.images,
							});
							setToast("Design created");
						} else if (editing) {
							await updateDesign(editing.id, {
								name: vals.name,
								description: vals.description,
								price: vals.price,
								images: vals.images, // optional; send if user selected new files
							});
							setToast("Design updated");
						}
						setFormOpen(false);
						await fetchData();
					} catch (e: any) {
						setFormError(e?.message ?? "Failed to save");
					}
				}}
			/>

			{/* Delete */}
			<ConfirmDialog
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={async () => {
					if (toDelete) {
						await deleteDesign(toDelete.id);
						setToast("Design deleted");
						setConfirmOpen(false);
						setToDelete(null);
						await fetchData();
					}
				}}
				title="Delete design"
				content={`Delete ${toDelete?.name ?? "this design"}? This cannot be undone.`}
			/>

			<Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast ?? ""} />
		</Box>
	);
}
