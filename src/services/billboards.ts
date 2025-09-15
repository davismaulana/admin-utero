// src/services/billboards.ts
import api from "@/lib/api";

export type BillboardImage = {
  id: string;
  url: string;          // relative like "uploads/billboards/..."
  type: string;         // "billboard"
  billboardId: string;
  createdAt: string;
};

export type BillboardRow = {
  id: string;
  categoryId: string;
  location: string;
  description: string;
  cityId: string;
  provinceId: string;
  status: "Available" | "Unavailable" | string;
  mode: "Buy" | "Rent" | string;
  size: string;         // e.g. "3x4"
  orientation: string;  // e.g. "Vertical"
  display: string;      // e.g. "TwoSides"
  lighting: string;     // e.g. "Frontlite"
  tax: string;          // e.g. "PPN"
  landOwner?: string;
  rentPrice?: string | number | null;
  sellPrice?: string | number | null;
  servicePrice?: string | number | null;
  createdAt: string;
  updatedAt: string;
  image: BillboardImage[];
};

export type PageMeta = { page: number; pageSize: number; total: number; pages: number };
export type ListResponse<T> = { status: boolean; message: string; data: T[]; meta?: PageMeta };

// ———————————————————————————————————————————————————————————
// Utilities
// ———————————————————————————————————————————————————————————
export function extractErrorMessage(e: any): string {
  const d = e?.response?.data;
  if (!d) return e?.message || "Request failed";
  if (Array.isArray(d.message)) return d.message.join(", ");
  if (typeof d.message === "string") return d.message;
  return d.error || e?.message || "Request failed";
}

/** Accepts number or string like "12.000.000" → returns number, or undefined if empty */
function toIDRNumber(v?: string | number | null): number | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}

/** Append truthy scalar values to FormData */
function fdSet(fd: FormData, key: string, val: unknown) {
  if (val === undefined || val === null || val === "") return;
  fd.append(key, String(val));
}

// ———————————————————————————————————————————————————————————
// List (server-driven; optional sort keys supported)
// ———————————————————————————————————————————————————————————
export async function listBillboards(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "location" | "status" | "mode" | "rentPrice" | "sellPrice" | "servicePrice";
  sortDir?: "asc" | "desc";
}) {
  const { data } = await api.get<ListResponse<BillboardRow>>("/billboard/all/", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      sortBy: params.sortBy || undefined,
      sortDir: params.sortDir || undefined,
    },
  });
  return data;
}

// ———————————————————————————————————————————————————————————
// Detail
// ———————————————————————————————————————————————————————————
/** Extend row with optional detail-only fields. Keep optional so UI degrades gracefully. */
export type BillboardDetail = BillboardRow & {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  merchant?: { id: string; fullname: string; companyName: string } | null;
  category?: {
    id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  city?: {
    id: string;
    name: string;
    provinceId: string;
    province?: {
      id: string;
      name: string;
    } | null;
  } | null;
  provinceName?: string | null;
  cityName?: string | null;
  owner?: {
    id: string;
    fullname: string;
    companyName: string;
    ktp?: string;
    npwp?: string;
    ktpAddress?: string;
    officeAddress?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
};

export async function getBillboardDetail(id: string) {
  const { data } = await api.get<{ status: boolean; message: string; data: BillboardDetail }>(
    `/billboard/detail/${id}`
  );
  return data.data;
}

// ———————————————————————————————————————————————————————————
// Create / Update / Delete
// ———————————————————————————————————————————————————————————
export type CreateBillboardInput = {
  categoryId: string;
  location: string;
  description: string;
  cityId: string;
  provinceId: string;
  status: string;       // "Available" | "Unavailable"
  mode: string;         // "Buy" | "Rent"
  size: string;
  orientation: string;
  display: string;
  lighting: string;
  tax: string;
  landOwner?: string;
  rentPrice?: string | number;
  sellPrice?: string | number;
  servicePrice?: string | number;
  images?: File[];      // optional new uploads
};

export async function createBillboard(input: CreateBillboardInput) {
  try {
    const fd = new FormData();
    fdSet(fd, "categoryId", input.categoryId);
    fdSet(fd, "location", input.location);
    fdSet(fd, "description", input.description);
    fdSet(fd, "cityId", input.cityId);
    fdSet(fd, "provinceId", input.provinceId);
    fdSet(fd, "status", input.status);
    fdSet(fd, "mode", input.mode);
    fdSet(fd, "size", input.size);
    fdSet(fd, "orientation", input.orientation);
    fdSet(fd, "display", input.display);
    fdSet(fd, "lighting", input.lighting);
    fdSet(fd, "tax", input.tax);
    fdSet(fd, "landOwner", input.landOwner);

    const rent = toIDRNumber(input.rentPrice);
    const sell = toIDRNumber(input.sellPrice);
    const service = toIDRNumber(input.servicePrice);
    if (rent !== undefined) fdSet(fd, "rentPrice", rent);
    if (sell !== undefined) fdSet(fd, "sellPrice", sell);
    if (service !== undefined) fdSet(fd, "servicePrice", service);

    if (input.images?.length) {
      input.images.forEach((file) => fd.append("images", file));
      // If your backend expects "images[]" instead:
      // input.images.forEach((file) => fd.append("images[]", file));
    }

    const { data } = await api.post<{ status: boolean; message: string; data: BillboardDetail }>(
      "/billboard/create",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export type UpdateBillboardInput = Partial<
  Pick<
    CreateBillboardInput,
    | "categoryId"
    | "location"
    | "description"
    | "cityId"
    | "provinceId"
    | "status"
    | "mode"
    | "size"
    | "orientation"
    | "display"
    | "lighting"
    | "tax"
    | "landOwner"
    | "rentPrice"
    | "sellPrice"
    | "servicePrice"
  >
> & {
  /** Add new images */
  imagesAdd?: File[];
  /** Delete existing images by id */
  imagesDeleteIds?: string[];
};

export async function updateBillboard(id: string, input: UpdateBillboardInput) {
  try {
    // Prefer PATCH; switch to PUT if your backend requires.
    // If backend expects JSON for simple fields and multipart only when files exist:
    const hasFiles = !!(input.imagesAdd && input.imagesAdd.length);
    if (hasFiles) {
      const fd = new FormData();
      // scalars
      fdSet(fd, "categoryId", input.categoryId);
      fdSet(fd, "location", input.location);
      fdSet(fd, "description", input.description);
      fdSet(fd, "cityId", input.cityId);
      fdSet(fd, "provinceId", input.provinceId);
      fdSet(fd, "status", input.status);
      fdSet(fd, "mode", input.mode);
      fdSet(fd, "size", input.size);
      fdSet(fd, "orientation", input.orientation);
      fdSet(fd, "display", input.display);
      fdSet(fd, "lighting", input.lighting);
      fdSet(fd, "tax", input.tax);
      fdSet(fd, "landOwner", input.landOwner);

      const rent = toIDRNumber(input.rentPrice);
      const sell = toIDRNumber(input.sellPrice);
      const service = toIDRNumber(input.servicePrice);
      if (rent !== undefined) fdSet(fd, "rentPrice", rent);
      if (sell !== undefined) fdSet(fd, "sellPrice", sell);
      if (service !== undefined) fdSet(fd, "servicePrice", service);

      input.imagesAdd?.forEach((file) => fd.append("images", file));
      input.imagesDeleteIds?.forEach((imgId) => fd.append("imagesDeleteIds[]", imgId));

      const { data } = await api.patch<{ status: boolean; message: string; data: BillboardDetail }>(
        `/billboard/id/${id}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data;
    } else {
      // JSON-only patch
      const payload: Record<string, any> = {};
      const set = (k: keyof UpdateBillboardInput) => {
        const v = input[k];
        if (v !== undefined && v !== null && v !== "") (payload as any)[k] = v;
      };
      set("categoryId"); set("location"); set("description"); set("cityId"); set("provinceId");
      set("status"); set("mode"); set("size"); set("orientation"); set("display"); set("lighting");
      set("tax"); set("landOwner");

      const rent = toIDRNumber(input.rentPrice);
      const sell = toIDRNumber(input.sellPrice);
      const service = toIDRNumber(input.servicePrice);
      if (rent !== undefined) payload.rentPrice = rent;
      if (sell !== undefined) payload.sellPrice = sell;
      if (service !== undefined) payload.servicePrice = service;

      if (input.imagesDeleteIds?.length) payload.imagesDeleteIds = input.imagesDeleteIds;

      const { data } = await api.patch<{ status: boolean; message: string; data: BillboardDetail }>(
        `/billboard/id/${id}`,
        payload
      );
      return data.data;
    }
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function deleteBillboard(id: string) {
  // try {
  //   const { data } = await api.delete<{ status: boolean; message: string }>(`/billboard/${id}`);
  //   if (data && data.status === false) {
  //     throw new Error(data.message || "Delete failed");
  //   }
  //   return data;
  // } catch (e: any) {
  //   // show server message if available
  //   const msg =
  //     e?.response?.data?.message ??
  //     e?.response?.data?.error ??
  //     e?.message ??
  //     "Request failed";
  //   throw new Error(msg);
  // }
  const { data } = await api.delete<{ status: boolean; message: string }>(`/billboard/${id}`);
  return data;
}
