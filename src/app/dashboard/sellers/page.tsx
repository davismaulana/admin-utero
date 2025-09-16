// src/app/dashboard/merchants/page.tsx
"use client";

import * as React from "react";
import { listSellers, type SellerRow } from "@/services/sellers";
import { deleteUser, type UserRow } from "@/services/users"; // keep if you still delete via user API
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Avatar, Box, Button, Chip, IconButton, Snackbar, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { SellerDetailDialog } from "@/components/dashboard/sellers/merchant-detail-dialog";

const fmt = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
});

// simple masker: keep last n digits
function maskNumber(n: string | undefined, keep: number = 4) {
	if (!n) return "";
	const s = String(n).replace(/\s+/g, "");
	if (s.length <= keep) return s;
	return s.slice(0, -keep).replace(/./g, "•") + s.slice(-keep);
}

export default function SellersPage() {
	const [rows, setRows] = React.useState<SellerRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);
	const [totalCount, setTotalCount] = React.useState(0);
	const [search, setSearch] = React.useState("");
	const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "createdAt", sort: "desc" }]);
	const [toast, setToast] = React.useState<string | null>(null);

	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [toDelete, setToDelete] = React.useState<SellerRow | null>(null);
	const [detailOpen, setDetailOpen] = React.useState(false);
	const [detailId, setDetailId] = React.useState<string | null>(null);

	const fetchData = React.useCallback(async () => {
		setLoading(true);
		const sortBy = (sortModel[0]?.field as any) || "createdAt";
		const sortDir = (sortModel[0]?.sort ?? "desc") as "asc" | "desc";
		const res = await listSellers({
			page: page + 1,
			pageSize,
			search: search || undefined,
			sortBy,
			sortDir,
		});
		setRows(res.data);
		setRowCount(res.meta.total);
		setTotalCount(res.meta.total);
		setLoading(false);
	}, [page, pageSize, search, sortModel]);

	React.useEffect(() => {
		fetchData().catch(console.error);
	}, [fetchData]);

	const columns: GridColDef<SellerRow>[] = [
		{
			field: "avatar",
			headerName: "Avatar",
			width: 80,
			sortable: false,
			filterable: false,
			renderCell: ({ row }) => {
				const initial = (row.fullname?.[0] ?? row.companyName?.[0] ?? "M").toUpperCase();
				return <Avatar>{initial}</Avatar>;
			},
		},
		{ field: "fullname", headerName: "Fullname", flex: 1, minWidth: 180 },
		{ field: "companyName", headerName: "Company", flex: 1, minWidth: 200 },
		{
			field: "ktp",
			headerName: "KTP",
			minWidth: 160,
			valueFormatter: (p) => maskNumber(String(p)),
		},
		{
			field: "npwp",
			headerName: "NPWP",
			minWidth: 160,
			valueFormatter: (p) => maskNumber(String(p)),
		},
		{ field: "ktpAddress", headerName: "KTP Address", flex: 1.2, minWidth: 220 },
		{ field: "officeAddress", headerName: "Office Address", flex: 1.2, minWidth: 220 },
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
			width: 120,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<Stack direction="row" spacing={1}>
					<Tooltip title="View">
						<IconButton
							size="small"
							onClick={() => {
								setDetailId(params.row.id); // seller id
								setDetailOpen(true);
							}}
						>
							<VisibilityIcon fontSize="small" />
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
					<Typography variant="h5">Sellers</Typography>
					<Chip label={`Total: ${totalCount.toLocaleString()}`} size="small" variant="outlined" />
				</Stack>
				<Stack direction="row" spacing={1}>
					<TextField
						size="small"
						placeholder="Search fullname/company/npwp/ktp"
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
					sortingMode="server"
					sortModel={sortModel}
					onSortModelChange={setSortModel}
					pageSizeOptions={[5, 10, 20, 50]}
					disableRowSelectionOnClick
				/>
			</div>

			<SellerDetailDialog open={detailOpen} sellerId={detailId} onClose={() => setDetailOpen(false)} />

			{/* Delete */}
			<ConfirmDialog
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={async () => {
					if (toDelete) {
						// If you have a /seller delete endpoint, switch this to deleteMerchant(toDelete.id)
						await deleteUser(toDelete.userId || toDelete.id); // deleting the underlying user (current flow)
						setToast("Seller deleted");
						setConfirmOpen(false);
						setToDelete(null);
						await fetchData();
					}
				}}
				title="Delete seller"
				content={`Delete ${toDelete?.fullname ?? "this seller"}? This cannot be undone.`}
			/>

			<Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast ?? ""} />
		</Box>
	);
}
