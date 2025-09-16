// src/services/billboards.ts
import api from "@/lib/api";

export type BillboardImage = {
  id: string;
  url: string;
  type: string;          // "billboard"
  billboardId: string;
  createdAt: string;
};

export type BillboardRow = {
  id: string;
  ownerId: string;
  categoryId: string;
  description: string;
  location: string;
  cityId: string;
  provinceId: string;
  cityName?: string | null;
  provinceName?: string | null;

  status: "Available" | "NotAvailable" | string;
  mode: "Buy" | "Rent" | string;
  size: string;
  orientation: string;
  display: string;
  lighting: string;
  tax: string;
  landOwnership?: string;

  rentPrice?: string | number | null;
  sellPrice?: string | number | null;
  servicePrice?: string | number | null;

  createdAt: string;
  updatedAt: string;

  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedById?: string | null;

  view?: number;
  score?: number | null;
  scoreAt?: string | null;

  category?: { id: string; name: string; createdAt?: string; updatedAt?: string } | null;
  owner?: { id: string; userId: string; fullname: string; companyName: string } | null;
  image: BillboardImage[];
  city?: {
    id: string;
    name: string;
    provinceId: string;
    province?: { id: string; name: string } | null;
  } | null;

  // some lists include averageRating at item level; keep optional
  averageRating?: number;
};

export type PageMeta = { page: number; pageSize: number; total: number; pages: number };
export type ListResponse<T> = { status?: boolean; message?: string; data: T[]; meta?: PageMeta };

export type BillboardDetail = BillboardRow & {
  transaction?: any[]; // keep loose for now (you can type later)
};

export type DetailResponse = { status: boolean; message: string; data: BillboardDetail; averageRating?: number };

function extractErrorMessage(e: any): string {
  const d = e?.response?.data;
  if (!d) return e?.message || "Request failed";
  if (Array.isArray(d.message)) return d.message.join(", ");
  if (typeof d.message === "string") return d.message;
  return d.error || e?.message || "Request failed";
}

// ---------- Utils ----------
function toIDRNumber(v?: string | number | null): number | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const n = Number(String(v).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
function fdSet(fd: FormData, k: string, v: unknown) {
  if (v === undefined || v === null || v === "") return;
  fd.append(k, String(v));
}

// ---------- List ----------
export async function listBillboards(params: {
  page?: number; pageSize?: number; search?: string;
  // server has sort in service; add if you wire it later
}) {
  const { data } = await api.get<ListResponse<BillboardRow>>("/billboard/all", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
    },
  });
  return data;
}

// Admin-only recycle bin (guarded by backend)
export async function listBillboardsRecycleBin(params: { page?: number; pageSize?: number; search?: string }) {
  const { data } = await api.get<ListResponse<BillboardRow>>("/billboard/recycle-bin", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
    },
  });
  return data;
}

// Merchant-only: mine
export async function listMyBillboards(params: { page?: number; pageSize?: number; search?: string }) {
  const { data } = await api.get<ListResponse<BillboardRow>>("/billboard/myBillboards", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
    },
  });
  return data;
}

// ---------- Detail ----------
export async function getBillboardDetail(id: string) {
  const { data } = await api.get<DetailResponse>(`/billboard/detail/${id}`);
  return data; // keep averageRating available to caller
}

// ---------- Create / Update ----------
export type CreateBillboardInput = {
  categoryId: string;
  description: string;
  location: string;
  cityId: string;
  provinceId: string;
  status: string;
  mode: string;
  size: string;
  orientation: string;
  display: string;
  lighting: string;
  tax: string;
  landOwnership?: string;
  rentPrice?: string | number;
  sellPrice?: string | number;
  servicePrice?: string | number;
  images?: File[];
};

export async function createBillboard(input: CreateBillboardInput) {
  try {
    const fd = new FormData();
    fdSet(fd, "categoryId", input.categoryId);
    fdSet(fd, "description", input.description);
    fdSet(fd, "location", input.location);
    fdSet(fd, "cityId", input.cityId);
    fdSet(fd, "provinceId", input.provinceId);
    fdSet(fd, "status", input.status);
    fdSet(fd, "mode", input.mode);
    fdSet(fd, "size", input.size);
    fdSet(fd, "orientation", input.orientation);
    fdSet(fd, "display", input.display);
    fdSet(fd, "lighting", input.lighting);
    fdSet(fd, "tax", input.tax);
    fdSet(fd, "landOwnership", input.landOwnership);

    const rent = toIDRNumber(input.rentPrice);
    const sell = toIDRNumber(input.sellPrice);
    const service = toIDRNumber(input.servicePrice);
    if (rent !== undefined) fdSet(fd, "rentPrice", rent);
    if (sell !== undefined) fdSet(fd, "sellPrice", sell);
    if (service !== undefined) fdSet(fd, "servicePrice", service);

    input.images?.forEach((f) => fd.append("images", f));

    const res = await api.post<{ status: boolean; message: string; data: BillboardDetail }>("/billboard", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export type UpdateBillboardInput = Partial<CreateBillboardInput> & {
  images?: File[];           // add new images
  imagesDeleteIds?: string[]; // if your DTO supports it
};

export async function updateBillboard(id: string, input: UpdateBillboardInput) {
  try {
    const hasFiles = !!input.images?.length;
    if (hasFiles || input.imagesDeleteIds?.length) {
      const fd = new FormData();
      ([
        "categoryId", "description", "location", "cityId", "provinceId", "status", "mode",
        "size", "orientation", "display", "lighting", "tax", "landOwnership"
      ] as const).forEach((k) => fdSet(fd, k, (input as any)[k]));

      const rent = toIDRNumber(input.rentPrice);
      const sell = toIDRNumber(input.sellPrice);
      const service = toIDRNumber(input.servicePrice);
      if (rent !== undefined) fdSet(fd, "rentPrice", rent);
      if (sell !== undefined) fdSet(fd, "sellPrice", sell);
      if (service !== undefined) fdSet(fd, "servicePrice", service);

      input.images?.forEach((f) => fd.append("images", f));
      input.imagesDeleteIds?.forEach((id) => fd.append("imagesDeleteIds[]", id)); // only if DTO allows

      const { data } = await api.patch<{ status: boolean; message: string; data: BillboardDetail }>(
        `/billboard/${id}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data;
    } else {
      const payload: Record<string, any> = {};
      ([
        "categoryId", "description", "location", "cityId", "provinceId", "status", "mode",
        "size", "orientation", "display", "lighting", "tax", "landOwnership"
      ] as const).forEach((k) => {
        const v = (input as any)[k];
        if (v !== undefined && v !== null && v !== "") payload[k] = v;
      });
      const rent = toIDRNumber(input.rentPrice);
      const sell = toIDRNumber(input.sellPrice);
      const service = toIDRNumber(input.servicePrice);
      if (rent !== undefined) payload.rentPrice = rent;
      if (sell !== undefined) payload.sellPrice = sell;
      if (service !== undefined) payload.servicePrice = service;

      if (input.imagesDeleteIds?.length) payload.imagesDeleteIds = input.imagesDeleteIds;

      const { data } = await api.patch<{ status: boolean; message: string; data: BillboardDetail }>(
        `/billboard/${id}`,
        payload
      );
      return data.data;
    }
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

// ---------- Delete / Restore / Purge ----------
export async function deleteBillboard(id: string) {
  try {
    const { data } = await api.delete<{ status: boolean; message: string }>(`/billboard/${id}`);
    if (data && data.status === false) throw new Error(data.message || "Delete failed");
    return data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function restoreBillboard(id: string) {
  try {
    const { data } = await api.post<{ status: boolean; message: string }>(`/billboard/${id}/restore`, {});
    return data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function purgeBillboard(id: string) {
  try {
    const { data } = await api.delete<{ status: boolean; message: string }>(`/billboard/${id}/purge`, {
      params: { confirm: "true" },
    });
    return data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

// ---------- Recommendations ----------
export async function getRecommendationsDiagnostics(q: {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  province?: string;
  city?: string;
}): Promise<{ data: BillboardRow[]; meta?: PageMeta }> {
  const { data } = await api.get<{ data: BillboardRow[]; meta?: PageMeta }>(
    "/billboard/recommendations/diagnostics",
    { params: q }
  );
  return data;
}

export async function recomputeRecommendations(): Promise<{ updated: number }> {
  const { data } = await api.post<{ updated: number }>("/billboard/recommendations/recompute", {});
  return data;
}
