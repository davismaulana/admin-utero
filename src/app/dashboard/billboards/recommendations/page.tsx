// src/app/dashboard/recommendations/page.tsx
"use client";

import * as React from "react";
import { getRecommendationsDiagnostics, recomputeRecommendations, type BillboardRow } from "@/services/billboards";
import { listCities, listProvinces, type CityRow, type ProvinceRow } from "@/services/locations";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
	Alert,
	Autocomplete,
	Avatar,
	Box,
	Chip,
	CircularProgress,
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

import { Gate } from "@/components/auth/Gate";
import { BillboardDetailDialog } from "@/components/dashboard/billboards/billboard-detail-dialog";

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

type BillboardGridRow = BillboardRow & {
	city?: { name?: string | null; province?: { name?: string | null } | null } | null;
	category?: { id?: string | null; name?: string | null } | null;
	cityName?: string | null;
	provinceName?: string | null;
	score?: number | null;
	scoreAt?: string | null;
};

export default function RecommendationsPage() {
	const [rows, setRows] = React.useState<BillboardGridRow[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [rowCount, setRowCount] = React.useState(0);
	const [sortModel, setSortModel] = React.useState<GridSortModel>([{ field: "score", sort: "desc" }]);

	// Category (server-side filter, options discovered from API response)
	const [categoryOptions, setCategoryOptions] = React.useState<Array<{ id: string; name: string }>>([]);
	const [categoryId, setCategoryId] = React.useState<string>("");

	// Province & City (searchable dropdowns like Billboards page)
	const [provinceInput, setProvinceInput] = React.useState("");
	const [cityInput, setCityInput] = React.useState("");
	const [provinceOptions, setProvinceOptions] = React.useState<ProvinceRow[]>([]);
	const [cityOptions, setCityOptions] = React.useState<CityRow[]>([]);
	const [provinceLoading, setProvinceLoading] = React.useState(false);
	const [cityLoading, setCityLoading] = React.useState(false);
	const [selectedProvince, setSelectedProvince] = React.useState<ProvinceRow | null>(null);
	const [selectedCity, setSelectedCity] = React.useState<CityRow | null>(null);

	// Text search (client-side)
	const [search, setSearch] = React.useState("");

	const [toast, setToast] = React.useState<{ msg: string; severity: "success" | "error" } | null>(null);
	const [detailOpen, setDetailOpen] = React.useState(false);
	const [detailId, setDetailId] = React.useState<string | null>(null);
	const [recomputing, setRecomputing] = React.useState(false);

	const fetchData = React.useCallback(async () => {
		setLoading(true);
		try {
			const res = await getRecommendationsDiagnostics({
				page: page + 1,
				pageSize,
				categoryId: categoryId || undefined, // server-side category filter
				province: undefined, // province/city are filtered client-side here
				city: undefined,
			});

			// build category options from response (stable+unique)
			setCategoryOptions((prev) => {
				const map = new Map<string, string>();
				for (const p of prev) map.set(p.id, p.name);
				for (const r of res.data as BillboardGridRow[]) {
					const id = r.category?.id,
						name = r.category?.name;
					if (id && name) map.set(id, name);
				}
				return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
			});

			// quick client-side search on location/description
			const searched = search
				? res.data.filter(
						(r) =>
							r.location?.toLowerCase().includes(search.toLowerCase()) ||
							r.description?.toLowerCase().includes(search.toLowerCase())
					)
				: res.data;

			setRows(searched as BillboardGridRow[]);
			const total = res.meta?.total ?? searched.length;
			setRowCount(total);
		} catch (e: any) {
			setToast(e?.message ?? "Failed to load recommendations");
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, categoryId, search]);

	React.useEffect(() => {
		fetchData().catch(console.error);
	}, [fetchData]);

	// --- Province/City dropdown loaders (like Billboards page)
	const loadProvinces = React.useCallback(async (term: string) => {
		setProvinceLoading(true);
		try {
			const res = await listProvinces({ search: term || undefined, pageSize: 20 });
			setProvinceOptions(res.data);
		} finally {
			setProvinceLoading(false);
		}
	}, []);
	const loadCities = React.useCallback(async (term: string, provinceId?: string) => {
		setCityLoading(true);
		try {
			const res = await listCities({ search: term || undefined, pageSize: 20, provinceId });
			setCityOptions(res.data);
		} finally {
			setCityLoading(false);
		}
	}, []);

	// initial fills
	React.useEffect(() => {
		loadProvinces("");
	}, [loadProvinces]);
	React.useEffect(() => {
		loadCities("", selectedProvince?.id);
	}, [loadCities, selectedProvince?.id]);

	// client-side province/city filtering over rows
	const displayedRows = React.useMemo(() => {
		if (!selectedProvince && !selectedCity) return rows;

		return rows.filter((r) => {
			const cityName = r.city?.name ?? r.cityName ?? "";
			const provName = r.city?.province?.name ?? r.provinceName ?? "";
			const cityOk = selectedCity ? cityName === selectedCity.name : true;
			const provOk = selectedProvince ? provName === selectedProvince.name : true;
			return cityOk && provOk;
		});
	}, [rows, selectedProvince, selectedCity]);

	// Debounce server fetch on text search (no Apply button)
	React.useEffect(() => {
		const t = setTimeout(() => {
			setPage(0);
			fetchData().catch(console.error);
		}, 300);
		return () => clearTimeout(t);
	}, [search, fetchData]);

	const columns: GridColDef<BillboardGridRow>[] = [
		{
			field: "image",
			headerName: "Image",
			width: 90,
			sortable: false,
			filterable: false,
			renderCell: ({ row }) => {
				const src = resolveImgUrl(row.image?.[0]?.url);
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
		{ field: "location", headerName: "Location", flex: 1.2, minWidth: 220 },
		{
			field: "cityName",
			headerName: "City",
			minWidth: 150,
			valueGetter: (_v, row) => row.city?.name ?? row.cityName ?? "",
		},
		{
			field: "provinceName",
			headerName: "Province",
			minWidth: 160,
			valueGetter: (_v, row) => row.city?.province?.name ?? row.provinceName ?? "",
		},
		{
			field: "categoryName",
			headerName: "Category",
			minWidth: 140,
			valueGetter: (_v, row) => row.category?.name ?? "",
		},
		{ field: "status", headerName: "Status", minWidth: 120 },
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
			field: "score",
			headerName: "Score",
			minWidth: 110,
			headerAlign: "right",
			align: "right",
			valueFormatter: (p) => {
				const n = Number(getVFValue(p));
				return Number.isFinite(n) ? n.toFixed(3) : "";
			},
		},
		{
			field: "scoreAt",
			headerName: "Scored At",
			minWidth: 180,
			valueFormatter: (p) => {
				const d = new Date(String(getVFValue(p)));
				return isNaN(d.getTime()) ? "" : fmtDate.format(d);
			},
		},
		{
			field: "actions",
			headerName: "Actions",
			width: 90,
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
				</Stack>
			),
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
						<Typography variant="h5">Recommendations (Diagnostics)</Typography>
						<Chip label={`Total: ${rowCount.toLocaleString()}`} size="small" variant="outlined" />
					</Stack>

					<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
						{/* Live text search (debounced) */}
						<TextField
							size="small"
							placeholder="Search location/description"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>

						{/* Category (server-side) */}
						<FormControl size="small" sx={{ minWidth: 180 }}>
							<InputLabel id="cat-label">Category</InputLabel>
							<Select
								labelId="cat-label"
								label="Category"
								value={categoryId}
								onChange={(e) => {
									setCategoryId(e.target.value);
									setPage(0);
								}}
							>
								<MenuItem value="">All</MenuItem>
								{categoryOptions.map((c) => (
									<MenuItem key={c.id} value={c.id}>
										{c.name}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						{/* Province Autocomplete (with search) */}
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

						{/* City Autocomplete (scoped by province when selected) */}
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

						{/* Recompute */}
						<Tooltip title="Recompute scores">
							<span>
								<IconButton
									color="primary"
									disabled={recomputing}
									onClick={async () => {
										try {
											setRecomputing(true);
											const res = await recomputeRecommendations();
											setToast({ msg: `Scores recomputed. Updated: ${res.updated}`, severity: "success" });

											await fetchData();
										} catch (e: any) {
											setToast(e?.message ?? "Failed to recompute");
										} finally {
											setRecomputing(false);
										}
									}}
								>
									<RefreshIcon />
								</IconButton>
							</span>
						</Tooltip>
					</Stack>
				</Stack>
				<div style={{ height: 600, width: "100%" }}>
					<DataGrid<BillboardGridRow>
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
				<BillboardDetailDialog open={detailOpen} billboardId={detailId} onClose={() => setDetailOpen(false)} />
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
