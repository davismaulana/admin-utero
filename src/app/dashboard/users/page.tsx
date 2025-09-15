// src/app/dashboard/users/page.tsx
"use client";

import * as React from "react";
import { createUser, deleteUser, listUsers, updateUser, type UserRow } from "@/services/users";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Avatar, Box, Button, Chip, IconButton, Snackbar, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { UserFormDialog } from "@/components/dashboard/users/user-form-dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export default function UsersPage() {
	const [rows, setRows] = React.useState<UserRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);
	const [search, setSearch] = React.useState("");
	const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
	const [toast, setToast] = React.useState<string | null>(null);
	const [totalCount, setTotalCount] = React.useState(0);

	// dialog state
	const [formOpen, setFormOpen] = React.useState(false);
	const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
	const [editing, setEditing] = React.useState<UserRow | null>(null);

	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [toDelete, setToDelete] = React.useState<UserRow | null>(null);

	const fmt = new Intl.DateTimeFormat("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
	});

	const fetchData = React.useCallback(async () => {
		setLoading(true);
		const sortBy = sortModel.length ? (sortModel[0].field as any) : "createdAt";
		const sortDir = (sortModel[0]?.sort ?? "desc") as "asc" | "desc";
		const res = await listUsers({
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

	const columns: GridColDef<UserRow>[] = [
		{
			field: "profilePicture",
			headerName: "Avatar",
			width: 80,
			sortable: false,
			filterable: false,
			renderCell: (params) => {
				const src = params.value ? `${API_BASE}/${String(params.value)}` : undefined;
				const initial = (params.row.username?.[0] ?? params.row.email?.[0] ?? "U").toUpperCase();
				return <Avatar src={src}>{initial}</Avatar>;
			},
		},
		{ field: "username", headerName: "Username", flex: 1, minWidth: 160 },
		{ field: "email", headerName: "Email", flex: 1, minWidth: 220 },
		{ field: "phone", headerName: "Phone", minWidth: 140 },
		{ field: "level", headerName: "Level", minWidth: 120 },
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
					<Typography variant="h5">Users</Typography>
					<Chip label={`Total: ${totalCount.toLocaleString()}`} size="small" variant="outlined" />
				</Stack>
				<Stack direction="row" spacing={1}>
					<TextField
						size="small"
						placeholder="Search username/email/phone"
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
						Add user
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
					sortingMode="server"
					rowCount={rowCount}
					paginationModel={{ page, pageSize }}
					onPaginationModelChange={(m) => {
						setPage(m.page);
						setPageSize(m.pageSize);
					}}
					sortModel={sortModel}
					onSortModelChange={setSortModel}
					pageSizeOptions={[5, 10, 20, 50]}
					disableRowSelectionOnClick
				/>
			</div>

			{/* Create / Edit */}
			<UserFormDialog
				open={formOpen}
				mode={formMode}
				initial={
					editing
						? {
								username: editing.username,
								email: editing.email,
								phone: editing.phone ?? "",
								level: editing.level,
							}
						: undefined
				}
				onClose={() => setFormOpen(false)}
				onSubmit={async (vals) => {
					if (formMode === "create") {
						await createUser({
							username: vals.username,
							email: vals.email,
							phone: vals.phone,
							level: vals.level,
							password: vals.password || "",
							confirmPassword: vals.confirmPassword || "",
						});
						setToast("User created");
					} else if (editing) {
						await updateUser(editing.id, {
							username: vals.username,
							email: vals.email,
							phone: vals.phone,
							level: vals.level,
							password: vals.password,
							confirmPassword: vals.confirmPassword,
						});
						setToast("User updated");
					}
					setFormOpen(false);
					await fetchData();
				}}
			/>

			{/* Delete */}
			<ConfirmDialog
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={async () => {
					if (toDelete) {
						await deleteUser(toDelete.id);
						setToast("User deleted");
						setConfirmOpen(false);
						setToDelete(null);
						await fetchData();
					}
				}}
				title="Delete user"
				content={`Delete ${toDelete?.username ?? "this user"}? This cannot be undone.`}
			/>

			<Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast(null)} message={toast ?? ""} />
		</Box>
	);
}
