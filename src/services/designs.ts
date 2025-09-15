import api from "@/lib/api";

export type DesignImage = {
  id: string;
  url: string;
  type: string;
  billboardId: string | null;
  designId: string;
  createdAt: string;
};

export type DesignRow = {
  id: string;
  name: string;
  description: string;
  price: string; // API sends string; keep as string to avoid float issues
  createdAt: string;
  updatedAt: string;
  image: DesignImage[];
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

export type ListResponse<T> = {
  status: boolean;
  message: string;
  data: T[];
  meta?: PageMeta; // some APIs might omit; treat as optional
};

function extractErrorMessage(e: any): string {
  const d = e?.response?.data;
  if (!d) return e?.message || "Request failed";
  if (Array.isArray(d.message)) return d.message.join(", ");
  if (typeof d.message === "string") return d.message;
  return d.error || e?.message || "Request failed";
}

export async function listDesigns(params: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const { data } = await api.get<ListResponse<DesignRow>>("/design", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
    },
  });
  return data;
}

export type CreateDesignInput = {
  name: string;
  description: string;
  price: string | number;
  images?: File[]; // multiple
};

export async function createDesign(payload: CreateDesignInput) {
  try {
    const fd = new FormData();
    fd.append("name", payload.name);
    fd.append("description", payload.description);
    fd.append("price", String(payload.price));
    (payload.images ?? []).forEach((file) => fd.append("images", file)); // multiple files

    const { data } = await api.post<{ status: boolean; message: string; data: DesignRow }>(
      "/design",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export type UpdateDesignInput = {
  name?: string;
  description?: string;
  price?: string | number;
  images?: File[]; // optional on edit; if provided, backend can add/replace depending on implementation
};

export async function updateDesign(id: string, payload: UpdateDesignInput) {
  try {
    const fd = new FormData();
    if (payload.name != null) fd.append("name", payload.name);
    if (payload.description != null) fd.append("description", payload.description);
    if (payload.price != null) fd.append("price", String(payload.price));
    (payload.images ?? []).forEach((file) => fd.append("images", file));

    // If your API is /design/:id instead of /design/id/:id, change it below.
    const { data } = await api.patch<{ status: boolean; message: string; data: DesignRow }>(
      `/design/${id}`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function deleteDesign(id: string) {
  // If your API is /design/:id instead, change to `/design/${id}`
  const { data } = await api.delete<{ status: boolean; message: string }>(`/design/${id}`);
  return data;
}
