// src/app/dashboard/users/page.tsx
"use client";

import * as React from "react";
import { listUsers, type UserRow } from "@/services/users";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export default function UsersPage() {
	const [rows, setRows] = React.useState<UserRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0); // DataGrid is 0-based
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);
	const [search, setSearch] = React.useState("");
	const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "createdAt", sort: "desc" }]);

	async function fetchData() {
		setLoading(true);
		const sortBy = sortModel[0]?.field as any;
		const sortDir = (sortModel[0]?.sort ?? "desc") as "asc" | "desc";

		const res = await listUsers({
			page: page + 1, // backend expects 1-based
			pageSize,
			search: search || undefined,
			includeMerchant: true,
			sortBy: (["createdAt", "updatedAt", "email", "username", "level"].includes(sortBy) ? sortBy : "createdAt") as any,
			sortDir,
		});

		setRows(res.data);
		setRowCount(res.meta.total);
		setLoading(false);
	}

	React.useEffect(() => {
		fetchData().catch(console.error);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, pageSize, sortModel]);

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
			field: "merchant",
			headerName: "Merchant",
			flex: 1,
			minWidth: 220,
			valueGetter: (_value, row) => row?.merchant?.companyName ?? "",
			sortable: false,
		},
		{ field: "createdAt", headerName: "Created", minWidth: 180 },
	];

	return (
		<Box sx={{ p: 2 }}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
				<Typography variant="h5">Users</Typography>
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
					onPaginationModelChange={(model) => {
						setPage(model.page);
						setPageSize(model.pageSize);
					}}
					pageSizeOptions={[5, 10, 20, 50]}
					sortModel={sortModel}
					onSortModelChange={setSortModel}
					disableRowSelectionOnClick
				/>
			</div>
		</Box>
	);
}
