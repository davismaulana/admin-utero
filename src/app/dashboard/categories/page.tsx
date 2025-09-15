"use client";

import * as React from "react";
import {
	createCategory,
	deleteCategory,
	listCategories,
	updateCategory,
	type CategoryRow,
} from "@/services/categories";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Box, Button, Chip, IconButton, Snackbar, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CategoryFormDialog } from "@/components/dashboard/categories/category-form-dialog";

export default function CategoriesPage() {
	const [rows, setRows] = React.useState<CategoryRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);
	const [totalCount, setTotalCount] = React.useState(0);
	const [search, setSearch] = React.useState("");
	// sorting optional — backend contract didn't specify sorting, so keep client-only
	const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "createdAt", sort: "desc" }]);
	const [toast, setToast] = React.useState<string | null>(null);

	// dialogs
	const [formOpen, setFormOpen] = React.useState(false);
	const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
	const [editing, setEditing] = React.useState<CategoryRow | null>(null);
	const [formError, setFormError] = React.useState<string | null>(null);

	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [toDelete, setToDelete] = React.useState<CategoryRow | null>(null);

	const fmt = new Intl.DateTimeFormat("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
	});

	const fetchData = React.useCallback(async () => {
		setLoading(true);
		const res = await listCategories({
			page: page + 1,
			pageSize,
			search: search || undefined,
			// sort omitted (not in your contract)
		});
		setRows(res.data);
		setRowCount(res.meta.total);
		setTotalCount(res.meta.total);
		setLoading(false);
	}, [page, pageSize, search]);

	React.useEffect(() => {
		fetchData().catch(console.error);
	}, [fetchData]);

	const columns: GridColDef<CategoryRow>[] = [
		{ field: "name", headerName: "Name", flex: 1, minWidth: 220 },
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
			field: "updatedAt",
			headerName: "Updated",
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
					<Typography variant="h5">Categories</Typography>
					<Chip label={`Total: ${totalCount.toLocaleString()}`} size="small" variant="outlined" />
				</Stack>

				<Stack direction="row" spacing={1}>
					<TextField
						size="small"
						placeholder="Search name"
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
						Add category
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
					// sorting kept client-side since API contract didn't specify sort
					sortingMode="client"
					sortModel={sortModel}
					onSortModelChange={setSortModel}
					pageSizeOptions={[5, 10, 20, 50]}
					disableRowSelectionOnClick
				/>
			</div>

			{/* Create / Edit */}
			<CategoryFormDialog
				open={formOpen}
				mode={formMode}
				initial={editing ? { name: editing.name } : undefined}
				serverError={formError}
				onClose={() => setFormOpen(false)}
				onSubmit={async (vals) => {
					try {
						setFormError(null);
						if (formMode === "create") {
							await createCategory({ name: vals.name.trim() });
							setToast("Category created");
						} else if (editing) {
							await updateCategory(editing.id, { name: vals.name.trim() });
							setToast("Category updated");
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
						await deleteCategory(toDelete.id);
						setToast("Category deleted");
						setConfirmOpen(false);
						setToDelete(null);
						await fetchData();
					}
				}}
				title="Delete category"
				content={`Delete ${toDelete?.name ?? "this category"}? This cannot be undone.`}
			/>

			<Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast ?? ""} />
		</Box>
	);
}
