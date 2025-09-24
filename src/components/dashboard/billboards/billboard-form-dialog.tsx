// src/components/dashboard/billboards/billboard-form-dialog.tsx
"use client";

import * as React from "react";
import { createBillboard, type CreateBillboardInput } from "@/services/billboards";
import { listCities, listProvinces, type CityRow, type ProvinceRow } from "@/services/locations";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

// ---------- Option constants ----------
const STATUS_OPTS = ["Available", "NotAvailable"] as const;
const MODE_OPTS = ["Buy", "Rent"] as const;

type Opt = { value: string; label: string };
const orientationOptions: Opt[] = [
	{ value: "Vertical", label: "Vertical" },
	{ value: "Horizontal", label: "Horizontal" },
];
const displayOptions: Opt[] = [
	{ value: "OneSide", label: "One Side" },
	{ value: "TwoSides", label: "Two Sides" },
	{ value: "ThreeSides", label: "Three Sides" },
	{ value: "FourSides", label: "Four Sides" },
];
const lightingOptions: Opt[] = [
	{ value: "Frontlite", label: "Frontlite" },
	{ value: "Backlite", label: "Backlite" },
	{ value: "None", label: "None" },
];
const taxOptions: Opt[] = [
	{ value: "PPN", label: "PPN" },
	{ value: "PPH", label: "PPH" },
	{ value: "NoPPN", label: "No PPN" },
	{ value: "NoPPH", label: "No PPH" },
	{ value: "NotIncludePPNYet", label: "Not Include PPN Yet" },
	{ value: "NotIncludePPHYet", label: "Not Include PPH Yet" },
];
const landOptions: Opt[] = [
	{ value: "State", label: "State" },
	{ value: "Private", label: "Private" },
];

// Categories fetcher
type CategoryRow = { id: string; name: string };
async function fetchCategories(term = ""): Promise<CategoryRow[]> {
	const url = new URL(API_BASE + "/category");
	if (term) url.searchParams.set("search", term);
	url.searchParams.set("pageSize", "20");
	const r = await fetch(url.href, { credentials: "include" });
	const json = await r.json().catch(() => null);
	return (json?.data as CategoryRow[]) ?? [];
}

type Mode = (typeof MODE_OPTS)[number];
type Status = (typeof STATUS_OPTS)[number];

export function AddBillboardDialog({
	open,
	onClose,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	onCreated?: () => void;
}) {
	// ---- state ----
	const [mode, setMode] = React.useState<Mode>("Buy");
	const [status, setStatus] = React.useState<Status>("Available");
	const [size, setSize] = React.useState("");

	// enums (store string codes)
	const [orientation, setOrientation] = React.useState<string>("");
	const [display, setDisplay] = React.useState<string>("");
	const [lighting, setLighting] = React.useState<string>("");
	const [tax, setTax] = React.useState<string>("");
	const [landOwnership, setLandOwnership] = React.useState<string>("");

	const [location, setLocation] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [rentPrice, setRentPrice] = React.useState<string>("");
	const [sellPrice, setSellPrice] = React.useState<string>("");
	const [servicePrice, setServicePrice] = React.useState<string>("");

	// dropdowns with search
	const [catOptions, setCatOptions] = React.useState<CategoryRow[]>([]);
	const [catLoading, setCatLoading] = React.useState(false);
	const [catInput, setCatInput] = React.useState("");
	const [selectedCategory, setSelectedCategory] = React.useState<CategoryRow | null>(null);

	const [provOptions, setProvOptions] = React.useState<ProvinceRow[]>([]);
	const [provLoading, setProvLoading] = React.useState(false);
	const [provInput, setProvInput] = React.useState("");
	const [selectedProvince, setSelectedProvince] = React.useState<ProvinceRow | null>(null);

	const [cityOptions, setCityOptions] = React.useState<CityRow[]>([]);
	const [cityLoading, setCityLoading] = React.useState(false);
	const [cityInput, setCityInput] = React.useState("");
	const [selectedCity, setSelectedCity] = React.useState<CityRow | null>(null);

	const [error, setError] = React.useState<string | null>(null);
	const [saving, setSaving] = React.useState(false);

	// images
	const [images, setImages] = React.useState<File[]>([]);
	const [previews, setPreviews] = React.useState<string[]>([]);
	React.useEffect(() => {
		if (!images.length) return setPreviews([]);
		const urls = images.map((f) => URL.createObjectURL(f));
		setPreviews(urls);
		return () => urls.forEach((u) => URL.revokeObjectURL(u));
	}, [images]);

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files ? Array.from(e.target.files) : [];
		if (files.length) setImages((prev) => [...prev, ...files]);
	};

	// initial loads
	React.useEffect(() => {
		if (!open) return;
		(async () => {
			setCatLoading(true);
			try {
				setCatOptions(await fetchCategories(""));
			} finally {
				setCatLoading(false);
			}
		})();
		(async () => {
			setProvLoading(true);
			try {
				const res = await listProvinces({ pageSize: 20 });
				setProvOptions(res.data);
			} finally {
				setProvLoading(false);
			}
		})();
	}, [open]);

	// live loads
	const loadCategories = React.useCallback(async (term: string) => {
		setCatLoading(true);
		try {
			setCatOptions(await fetchCategories(term));
		} finally {
			setCatLoading(false);
		}
	}, []);
	const loadProvinces = React.useCallback(async (term: string) => {
		setProvLoading(true);
		try {
			setProvOptions((await listProvinces({ search: term || undefined, pageSize: 20 })).data);
		} finally {
			setProvLoading(false);
		}
	}, []);
	const loadCities = React.useCallback(async (term: string, provinceId?: string) => {
		setCityLoading(true);
		try {
			setCityOptions((await listCities({ search: term || undefined, pageSize: 20, provinceId })).data);
		} finally {
			setCityLoading(false);
		}
	}, []);

	// province -> refresh city list
	React.useEffect(() => {
		if (!open) return;
		setSelectedCity(null);
		loadCities("", selectedProvince?.id);
	}, [open, selectedProvince?.id, loadCities]);

	const toNumber = (s: string) => {
		if (!s) return undefined;
		const n = Number(String(s).replace(/[^\d.-]/g, ""));
		return Number.isFinite(n) ? n : undefined;
	};

	const handleSubmit = async () => {
		setError(null);
		if (!selectedCategory?.id) return setError("Category is required");
		if (!selectedProvince?.id) return setError("Province is required");
		if (!selectedCity?.id) return setError("City is required");
		if (!location.trim()) return setError("Location is required");
		if (!servicePrice.trim()) return setError("Service price is required");

		const payload: CreateBillboardInput = {
			categoryId: selectedCategory.id,
			description,
			location,
			cityId: selectedCity.id,
			provinceId: selectedProvince.id,
			status,
			mode,
			size,
			orientation,
			display,
			lighting,
			tax,
			landOwnership,
			servicePrice: toNumber(servicePrice),
			images,
			...(mode === "Rent" ? { rentPrice: toNumber(rentPrice) } : {}),
			...(mode === "Buy" ? { sellPrice: toNumber(sellPrice) } : {}),
		} as any;

		try {
			setSaving(true);
			await createBillboard(payload);
			onCreated?.();
			onClose();
			setImages([]);
			setRentPrice("");
			setSellPrice("");
			setServicePrice("");
		} catch (e: any) {
			setError(e?.message || "Failed to create billboard");
		} finally {
			setSaving(false);
		}
	};

	const showRent = mode === "Rent";
	const showSell = mode === "Buy";

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
			<DialogTitle>New Billboard</DialogTitle>
			<DialogContent
				dividers
				sx={{
					pt: 2,
				}}
			>
				<Stack spacing={2.5}>
					{error && <Alert severity="error">{error}</Alert>}

					{/* Section: Location */}
					<Section title="Placement">
						<Grid container spacing={2}>
							<Grid item xs={12} md={4}>
								<Autocomplete
									options={catOptions}
									loading={catLoading}
									value={selectedCategory}
									onChange={(_e, v) => setSelectedCategory(v)}
									inputValue={catInput}
									onInputChange={(_e, v) => {
										setCatInput(v);
										loadCategories(v);
									}}
									getOptionLabel={(o) => o?.name || ""}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Category"
											fullWidth
											InputProps={{
												...params.InputProps,
												endAdornment: (
													<>
														{catLoading ? <CircularProgress size={18} /> : null}
														{params.InputProps.endAdornment}
													</>
												),
											}}
											required
										/>
									)}
								/>
							</Grid>

							<Grid item xs={12} md={4}>
								<Autocomplete
									options={provOptions}
									loading={provLoading}
									value={selectedProvince}
									onChange={(_e, v) => setSelectedProvince(v)}
									inputValue={provInput}
									onInputChange={(_e, v) => {
										setProvInput(v);
										loadProvinces(v);
									}}
									getOptionLabel={(o) => o?.name || ""}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Province"
											fullWidth
											InputProps={{
												...params.InputProps,
												endAdornment: (
													<>
														{provLoading ? <CircularProgress size={18} /> : null}
														{params.InputProps.endAdornment}
													</>
												),
											}}
											required
										/>
									)}
								/>
							</Grid>

							<Grid item xs={12} md={4}>
								<Autocomplete
									options={cityOptions}
									loading={cityLoading}
									value={selectedCity}
									onChange={(_e, v) => setSelectedCity(v)}
									inputValue={cityInput}
									onInputChange={(_e, v) => {
										setCityInput(v);
										loadCities(v, selectedProvince?.id);
									}}
									getOptionLabel={(o) => o?.name || ""}
									renderInput={(params) => (
										<TextField
											{...params}
											label="City"
											fullWidth
											InputProps={{
												...params.InputProps,
												endAdornment: (
													<>
														{cityLoading ? <CircularProgress size={18} /> : null}
														{params.InputProps.endAdornment}
													</>
												),
											}}
											required
										/>
									)}
								/>
							</Grid>

							<Grid item xs={12}>
								<TextField
									label="Location (address / landmark)"
									value={location}
									onChange={(e) => setLocation(e.target.value)}
									fullWidth
									required
								/>
							</Grid>

							<Grid item xs={12}>
								<TextField
									label="Description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									fullWidth
									multiline
									minRows={2}
								/>
							</Grid>
						</Grid>
					</Section>

					{/* Section: Specs */}
					<Section title="Specifications">
						<Grid container spacing={2}>
							<Grid item xs={12} md={3}>
								<TextField select label="Mode" value={mode} onChange={(e) => setMode(e.target.value as Mode)} fullWidth>
									{MODE_OPTS.map((m) => (
										<MenuItem key={m} value={m}>
											{m}
										</MenuItem>
									))}
								</TextField>
							</Grid>

							<Grid item xs={12} md={3}>
								<TextField
									select
									label="Status"
									value={status}
									onChange={(e) => setStatus(e.target.value as Status)}
									fullWidth
								>
									{STATUS_OPTS.map((s) => (
										<MenuItem key={s} value={s}>
											{s}
										</MenuItem>
									))}
								</TextField>
							</Grid>

							<Grid item xs={12} md={3}>
								<TextField label="Size" value={size} onChange={(e) => setSize(e.target.value)} fullWidth />
							</Grid>

							<Grid item xs={12} md={3}>
								<Autocomplete<Opt, false, false, false>
									options={orientationOptions}
									getOptionLabel={(o) => o.label}
									value={orientationOptions.find((o) => o.value === orientation) ?? null}
									onChange={(_e, v) => setOrientation(v?.value ?? "")}
									renderInput={(params) => <TextField {...params} label="Orientation" fullWidth required />}
								/>
							</Grid>

							<Grid item xs={12} md={3}>
								<Autocomplete<Opt, false, false, false>
									options={displayOptions}
									getOptionLabel={(o) => o.label}
									value={displayOptions.find((o) => o.value === display) ?? null}
									onChange={(_e, v) => setDisplay(v?.value ?? "")}
									renderInput={(params) => <TextField {...params} label="Display" fullWidth required />}
								/>
							</Grid>

							<Grid item xs={12} md={3}>
								<Autocomplete<Opt, false, false, false>
									options={lightingOptions}
									getOptionLabel={(o) => o.label}
									value={lightingOptions.find((o) => o.value === lighting) ?? null}
									onChange={(_e, v) => setLighting(v?.value ?? "")}
									renderInput={(params) => <TextField {...params} label="Lighting" fullWidth required />}
								/>
							</Grid>

							<Grid item xs={12} md={3}>
								<Autocomplete<Opt, false, false, false>
									options={taxOptions}
									getOptionLabel={(o) => o.label}
									value={taxOptions.find((o) => o.value === tax) ?? null}
									onChange={(_e, v) => setTax(v?.value ?? "")}
									renderInput={(params) => <TextField {...params} label="Tax" fullWidth required />}
								/>
							</Grid>

							<Grid item xs={12} md={3}>
								<Autocomplete<Opt, false, false, false>
									options={landOptions}
									getOptionLabel={(o) => o.label}
									value={landOptions.find((o) => o.value === landOwnership) ?? null}
									onChange={(_e, v) => setLandOwnership(v?.value ?? "")}
									renderInput={(params) => <TextField {...params} label="Land Ownership" fullWidth required />}
								/>
							</Grid>
						</Grid>
					</Section>

					{/* Section: Pricing */}
					<Section title="Pricing">
						<Grid container spacing={2}>
							{mode === "Rent" && (
								<Grid item xs={12} md={4}>
									<TextField
										label="Rent price (IDR)"
										value={rentPrice}
										onChange={(e) => setRentPrice(e.target.value)}
										fullWidth
									/>
								</Grid>
							)}
							{mode === "Buy" && (
								<Grid item xs={12} md={4}>
									<TextField
										label="Sell price (IDR)"
										value={sellPrice}
										onChange={(e) => setSellPrice(e.target.value)}
										fullWidth
									/>
								</Grid>
							)}
							<Grid item xs={12} md={4}>
								<TextField
									required
									label="Service price (IDR)"
									value={servicePrice}
									onChange={(e) => setServicePrice(e.target.value)}
									fullWidth
								/>
							</Grid>
						</Grid>
					</Section>

					{/* Section: Images */}
					<Section title="Images">
						<Stack spacing={1.5}>
							<Button variant="outlined" component="label" sx={{ alignSelf: "flex-start" }}>
								Upload Images
								<input type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
							</Button>

							{previews.length > 0 && (
								<Grid container spacing={2}>
									{previews.map((src, idx) => (
										<Grid item xs={6} sm={4} md={3} key={idx}>
											<Box
												sx={{
													position: "relative",
													borderRadius: 1.5,
													overflow: "hidden",
													border: "1px solid",
													borderColor: "divider",
												}}
											>
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={src}
													alt={`preview-${idx}`}
													style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
												/>
												<Button
													size="small"
													onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
													sx={{
														position: "absolute",
														top: 6,
														right: 6,
														minWidth: 0,
														width: 28,
														height: 28,
														borderRadius: "50%",
														p: 0,
														fontSize: "1rem",
														fontWeight: "bold",
														lineHeight: 1,
														color: "white",
														backgroundColor: "error.main",
														boxShadow: 3,
														"&:hover": { backgroundColor: "error.dark" },
													}}
												>
													✕
												</Button>
											</Box>
										</Grid>
									))}
								</Grid>
							)}
						</Stack>
					</Section>
				</Stack>
			</DialogContent>

			<DialogActions sx={{ px: 3, py: 2 }}>
				<Button onClick={onClose} disabled={saving}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} variant="contained" disabled={saving}>
					{saving ? "Saving…" : "Create"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// Small helper to give each section a title + divider and consistent spacing
function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Stack spacing={1.25}>
			<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
				{title}
			</Typography>
			{children}
			<Divider sx={{ mt: 1.25 }} />
		</Stack>
	);
}
