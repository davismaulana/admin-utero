"use client";

import * as React from "react";
import { deleteBillboard, listBillboards, type BillboardRow } from "@/services/billboards";
import { listCities, listProvinces, type CityRow, type ProvinceRow } from "@/services/locations";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
	Alert,
	Autocomplete,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	IconButton,
	Snackbar,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridSortModel } from "@mui/x-data-grid";

import { Gate } from "@/components/auth/Gate";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { BillboardDetailDialog } from "@/components/dashboard/billboards/billboard-detail-dialog";
import { BillboardFormDialog } from "@/components/dashboard/billboards/billboard-form-dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const fmtDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });
const currencyFmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
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

// --- Category shape for dropdown ---
type CategoryRow = { id: string; name: string };

export default function BillboardsPage() {
	const [rows, setRows] = React.useState<BillboardRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);
	const [totalCount, setTotalCount] = React.useState(0);
	const [search, setSearch] = React.useState("");
	const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "createdAt", sort: "desc" }]);
	const [toast, setToast] = React.useState<{ msg: string; severity: "success" | "error" } | null>(null);

	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [toDelete, setToDelete] = React.useState<BillboardRow | null>(null);
	const [detailOpen, setDetailOpen] = React.useState(false);
	const [detailId, setDetailId] = React.useState<string | null>(null);
	const [deleting, setDeleting] = React.useState(false);

	// Province & City selectors (with search)
	const [provinceInput, setProvinceInput] = React.useState("");
	const [cityInput, setCityInput] = React.useState("");
	const [provinceOptions, setProvinceOptions] = React.useState<ProvinceRow[]>([]);
	const [cityOptions, setCityOptions] = React.useState<CityRow[]>([]);
	const [provinceLoading, setProvinceLoading] = React.useState(false);
	const [cityLoading, setCityLoading] = React.useState(false);
	const [selectedProvince, setSelectedProvince] = React.useState<ProvinceRow | null>(null);
	const [selectedCity, setSelectedCity] = React.useState<CityRow | null>(null);

	// --- Category (searchable) ---
	const [categoryOptions, setCategoryOptions] = React.useState<CategoryRow[]>([]);
	const [categoryInput, setCategoryInput] = React.useState("");
	const [categoryLoading, setCategoryLoading] = React.useState(false);
	const [selectedCategory, setSelectedCategory] = React.useState<CategoryRow | null>(null);

	const [openAdd, setOpenAdd] = React.useState(false);

	const [editOpen, setEditOpen] = React.useState(false);
	const [editingRow, setEditingRow] = React.useState<BillboardRow | null>(null);

	// Load table
	const fetchData = React.useCallback(async () => {
		setLoading(true);
		try {
			const res = await listBillboards({
				page: page + 1,
				pageSize,
				search: search || undefined,
			});
			setRows(res.data);
			const total = res.meta?.total ?? res.data.length;
			setRowCount(total);
			setTotalCount(total);
		} catch (e: any) {
			setToast(e?.message ?? "Failed to load billboards");
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, search]);

	React.useEffect(() => {
		fetchData().catch(console.error);
	}, [fetchData]);

	// Provinces
	const loadProvinces = React.useCallback(async (term: string) => {
		setProvinceLoading(true);
		try {
			const res = await listProvinces({ search: term || undefined, pageSize: 20 });
			setProvinceOptions(res.data);
		} finally {
			setProvinceLoading(false);
		}
	}, []);
	// Cities (optionally by province)
	const loadCities = React.useCallback(async (term: string, provinceId?: string) => {
		setCityLoading(true);
		try {
			const res = await listCities({ search: term || undefined, pageSize: 20, provinceId });
			setCityOptions(res.data);
		} finally {
			setCityLoading(false);
		}
	}, []);

	// Categories (searchable)
	const loadCategories = React.useCallback(async (term: string) => {
		setCategoryLoading(true);
		try {
			const url = new URL(API_BASE + "/category");
			if (term) url.searchParams.set("search", term);
			url.searchParams.set("pageSize", "20");
			const r = await fetch(url.href, { credentials: "include" });
			const json = await r.json().catch(() => null);
			const arr: CategoryRow[] = json?.data || [];
			setCategoryOptions(arr);
		} catch {
			setCategoryOptions([]);
		} finally {
			setCategoryLoading(false);
		}
	}, []);

	// Initial loads so dropdowns aren't empty
	React.useEffect(() => {
		loadProvinces("");
	}, [loadProvinces]);
	React.useEffect(() => {
		loadCities("", selectedProvince?.id);
	}, [loadCities, selectedProvince?.id]);
	React.useEffect(() => {
		loadCategories("");
	}, [loadCategories]);

	// Client-side filtering by province, city, and category
	const displayedRows = React.useMemo(() => {
		return rows.filter((r) => {
			const cityName = (r as any).city?.name ?? (r as any).cityName ?? "";
			const provName = (r as any).city?.province?.name ?? (r as any).provinceName ?? "";
			const catId = (r as any).category?.id ?? r.categoryId;

			const cityOk = selectedCity ? cityName === selectedCity.name : true;
			const provOk = selectedProvince ? provName === selectedProvince.name : true;
			const catOk = selectedCategory ? catId === selectedCategory.id : true;

			return cityOk && provOk && catOk;
		});
	}, [rows, selectedProvince, selectedCity, selectedCategory]);

	// Columns
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
		{ field: "location", headerName: "Location", flex: 1, minWidth: 200 },
		{
			field: "cityName",
			headerName: "City",
			minWidth: 160,
			valueGetter: (_value, row) => (row as any).city?.name ?? (row as any).cityName ?? "",
		},
		{
			field: "provinceName",
			headerName: "Province",
			minWidth: 180,
			valueGetter: (_value, row) => (row as any).city?.province?.name ?? (row as any).provinceName ?? "",
		},
		{
			field: "category",
			headerName: "Category",
			minWidth: 160,
			valueGetter: (_value, row) => (row as any).category?.name ?? "",
		},
		{ field: "size", headerName: "Size", minWidth: 100 },
		{ field: "orientation", headerName: "Orientation", minWidth: 120 },
		{ field: "display", headerName: "Display", minWidth: 120 },
		{ field: "status", headerName: "Status", minWidth: 110 },
		{ field: "mode", headerName: "Mode", minWidth: 90 },
		{
			field: "rentPrice",
			headerName: "Rent",
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
			field: "createdAt",
			headerName: "Created",
			minWidth: 180,
			valueFormatter: (p) => {
				const d = new Date(String(p));
				return isNaN(d.getTime()) ? "" : fmtDate.format(d);
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
								setDetailId(params.row.id);
								setDetailOpen(true);
							}}
						>
							<VisibilityIcon fontSize="small" />
						</IconButton>
					</Tooltip>

					<Gate allowed={["SELLER"]}>
						<Tooltip title="Edit">
							<IconButton
								size="small"
								onClick={() => {
									setEditingRow(params.row);
									setEditOpen(true);
								}}
							>
								<EditIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</Gate>

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
					<Typography variant="h5">Billboards</Typography>
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

					{/* Province dropdown with search */}
					<Autocomplete
						sx={{ minWidth: 220 }}
						size="small"
						options={provinceOptions}
						getOptionLabel={(o) => o.name || ""}
						value={selectedProvince}
						onChange={(_e, v) => {
							setSelectedProvince(v);
							setSelectedCity(null);
							loadCities(cityInput, v?.id);
						}}
						inputValue={provinceInput}
						onInputChange={(_e, v) => {
							setProvinceInput(v);
							loadProvinces(v);
						}}
						loading={provinceLoading}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Province"
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{provinceLoading ? <CircularProgress size={18} /> : null}
											{params.InputProps.endAdornment}
										</>
									),
								}}
							/>
						)}
					/>

					{/* City dropdown with search */}
					<Autocomplete
						sx={{ minWidth: 220 }}
						size="small"
						options={cityOptions}
						getOptionLabel={(o) => o.name || ""}
						value={selectedCity}
						onChange={(_e, v) => setSelectedCity(v)}
						inputValue={cityInput}
						onInputChange={(_e, v) => {
							setCityInput(v);
							loadCities(v, selectedProvince?.id);
						}}
						loading={cityLoading}
						renderInput={(params) => (
							<TextField
								{...params}
								label="City"
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{cityLoading ? <CircularProgress size={18} /> : null}
											{params.InputProps.endAdornment}
										</>
									),
								}}
							/>
						)}
					/>

					{/* Category dropdown with search */}
					<Autocomplete
						sx={{ minWidth: 220 }}
						size="small"
						options={categoryOptions}
						getOptionLabel={(o) => o.name || ""}
						value={selectedCategory}
						onChange={(_e, v) => setSelectedCategory(v)}
						inputValue={categoryInput}
						onInputChange={(_e, v) => {
							setCategoryInput(v);
							loadCategories(v);
						}}
						loading={categoryLoading}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Category"
								placeholder="All categories"
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{categoryLoading ? <CircularProgress size={18} /> : null}
											{params.InputProps.endAdornment}
										</>
									),
								}}
							/>
						)}
					/>
					<Gate allowed={["SELLER"]}>
						<Button variant="contained" onClick={() => setOpenAdd(true)}>
							Add billboard
						</Button>
						<BillboardFormDialog open={openAdd} mode="create" onClose={() => setOpenAdd(false)} onSaved={fetchData} />
					</Gate>
				</Stack>
			</Stack>

			<div style={{ height: 600, width: "100%" }}>
				<DataGrid
					rows={displayedRows}
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

			{/* Detail */}
			<BillboardDetailDialog open={detailOpen} billboardId={detailId} onClose={() => setDetailOpen(false)} />

			{/* Delete */}
			<ConfirmDialog
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={async () => {
					if (!toDelete || deleting) return;
					try {
						setDeleting(true);
						await deleteBillboard(toDelete.id);
						setToast({ msg: "Billboard deleted", severity: "success" });
						setConfirmOpen(false);
						setToDelete(null);
						await fetchData();
					} catch (err: any) {
						setToast(err?.message || "Failed to delete billboard");
					} finally {
						setDeleting(false);
					}
				}}
				title="Delete billboard"
				content={`Delete ${toDelete?.location ?? "this billboard"}? This cannot be undone.`}
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
			</Snackbar>

			{editingRow && (
				<BillboardFormDialog
					open={editOpen}
					mode="edit"
					billboardId={editingRow.id}
					initial={{
						id: editingRow.id,
						category: (editingRow as any).category ?? null,
						categoryId: (editingRow as any).category?.id ?? (editingRow as any).categoryId,
						city: (editingRow as any).city ?? null,
						cityId: (editingRow as any).city?.id ?? (editingRow as any).cityId,
						province: (editingRow as any).city?.province ?? null,
						provinceId: (editingRow as any).provinceId,
						mode: editingRow.mode as any,
						status: editingRow.status as any,
						size: editingRow.size ?? "",
						orientation: editingRow.orientation ?? "",
						display: editingRow.display ?? "",
						lighting: editingRow.lighting ?? "",
						tax: editingRow.tax ?? "",
						landOwnership: (editingRow as any).landOwnership ?? "",
						location: editingRow.location ?? "",
						description: (editingRow as any).description ?? "",
						rentPrice: (editingRow as any).rentPrice ?? "",
						sellPrice: (editingRow as any).sellPrice ?? "",
						servicePrice: (editingRow as any).servicePrice ?? "",
						images: ((editingRow as any).image ?? []).map((im: any) => ({
							id: im.id,
							url: im.url,
						})),
					}}
					onClose={() => {
						setEditOpen(false);
						setEditingRow(null);
					}}
					onSaved={fetchData}
				/>
			)}
		</Box>
	);
}
