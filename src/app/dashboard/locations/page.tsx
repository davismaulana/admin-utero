// src/app/dashboard/locations/page.tsx
"use client";

import * as React from "react";
import {
	createCity,
	deleteCity,
	listCities,
	listProvinces,
	updateCity,
	type CityRow,
	type ProvinceRow,
} from "@/services/locations";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Snackbar,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CityFormDialog } from "@/components/dashboard/locations/city-form-dialog";

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export default function LocationsPage() {
	const [rows, setRows] = React.useState<CityRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);

	const [provinces, setProvinces] = React.useState<ProvinceRow[]>([]);
	const [provMap, setProvMap] = React.useState<Record<string, string>>({});

	const [provinceFilter, setProvinceFilter] = React.useState<string>("");
	const [search, setSearch] = React.useState("");

	const [toast, setToast] = React.useState<{ msg: string; severity: "success" | "error" } | null>(null);

	const [formOpen, setFormOpen] = React.useState(false);
	const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
	const [editing, setEditing] = React.useState<CityRow | null>(null);
	const [formError, setFormError] = React.useState<string | null>(null);
	const [submitting, setSubmitting] = React.useState(false);

	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [toDelete, setToDelete] = React.useState<CityRow | null>(null);
	const [deleting, setDeleting] = React.useState(false);

	// load provinces (first page big enough to cover all, or loop if you prefer)
	React.useEffect(() => {
		(async () => {
			try {
				const res = await listProvinces({ page: 1, pageSize: 500 });
				setProvinces(res.data);
				setProvMap(Object.fromEntries(res.data.map((p) => [p.id, p.name])));
			} catch (e: any) {
				setToast(e?.message || "Failed to load provinces");
			}
		})();
	}, []);

	const fetchData = React.useCallback(async () => {
		setLoading(true);
		try {
			const res = await listCities({
				page: page + 1,
				pageSize,
				search: search || undefined,
				provinceId: provinceFilter || undefined, // backend may ignore if not supported
			});
			setRows(res.data);
			const total = res.meta?.total ?? res.data.length;
			setRowCount(total);
		} catch (e: any) {
			setToast(e?.message || "Failed to load cities");
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, search, provinceFilter]);

	React.useEffect(() => {
		fetchData().catch(console.error);
	}, [fetchData]);

	const columns: GridColDef<CityRow>[] = [
		{ field: "name", headerName: "City", flex: 1, minWidth: 200 },
		{
			field: "province",
			headerName: "Province",
			flex: 1,
			minWidth: 220,
			valueGetter: (_v, row) => provMap[row.provinceId] ?? "",
		},
		{
			field: "actions",
			headerName: "Actions",
			width: 120,
			sortable: false,
			filterable: false,
			renderCell: (params) => (
				<Stack direction="row" spacing={1}>
					<Tooltip title="Edit">
						<IconButton
							size="small"
							onClick={() => {
								setEditing(params.row);
								setFormMode("edit");
								setFormError(null);
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
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				sx={{ mb: 2, gap: 1, flexWrap: "wrap" }}
			>
				<Stack direction="row" spacing={1} alignItems="center">
					<Typography variant="h5">Locations</Typography>
					<Chip label={`Total: ${rowCount.toLocaleString()}`} size="small" variant="outlined" />
				</Stack>

				<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
					<TextField
						size="small"
						placeholder="Search city"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								setPage(0);
								fetchData();
							}
						}}
					/>

					<FormControl size="small" sx={{ minWidth: 220 }}>
						<InputLabel id="prov-filter-label">Province</InputLabel>
						<Select
							labelId="prov-filter-label"
							label="Province"
							value={provinceFilter}
							onChange={(e) => {
								setProvinceFilter(e.target.value);
								setPage(0);
							}}
						>
							<MenuItem value="">All provinces</MenuItem>
							{provinces.map((p) => (
								<MenuItem key={p.id} value={p.id}>
									{p.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() => {
							setFormMode("create");
							setEditing(null);
							setFormError(null);
							setFormOpen(true);
						}}
					>
						New city
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
					sortingMode="client"
					pageSizeOptions={[5, 10, 20, 50]}
					disableRowSelectionOnClick
				/>
			</div>
			{/* Create / Edit dialog */}
			<CityFormDialog
				open={formOpen}
				mode={formMode}
				provinces={provinces}
				initial={editing}
				error={formError}
				submitting={submitting}
				onClose={() => setFormOpen(false)}
				onSubmit={async (payload) => {
					try {
						setSubmitting(true);
						if (formMode === "create") {
							await createCity(payload);
							setToast({ msg: "City created", severity: "success" });
						} else if (editing) {
							await updateCity(editing.id, payload);
							setToast({ msg: "City updated", severity: "success" });
						}
						setFormOpen(false);
						await fetchData();
					} catch (e: any) {
						setFormError(e?.message || "Failed to save city");
					} finally {
						setSubmitting(false);
					}
				}}
			/>
			{/* Delete */}
			<ConfirmDialog
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={async () => {
					if (!toDelete || deleting) return;
					try {
						setDeleting(true);
						await deleteCity(toDelete.id);
						setToast({ msg: "City deleted", severity: "success" });
						setConfirmOpen(false);
						setToDelete(null);
						await fetchData();
					} catch (e: any) {
						setToast(e?.message || "Failed to delete city");
					} finally {
						setDeleting(false);
					}
				}}
				title="Delete city"
				content={`Delete ${toDelete?.name ?? "this city"}? This cannot be undone.`}
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
