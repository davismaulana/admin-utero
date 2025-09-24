import api from "@/lib/api";

export type ProvinceRow = {
  id: string;
  name: string;
};

export type CityRow = {
  id: string;
  name: string;
  provinceId: string;
};

export type PageMeta = { page: number; pageSize: number; total: number; pages: number };
export type ListResponse<T> = { status: boolean; message: string; data: T[]; meta?: PageMeta };

function extractErrorMessage(e: any): string {
  const d = e?.response?.data;
  if (!d) return e?.message || "Request failed";
  if (Array.isArray(d.message)) return d.message.join(", ");
  if (typeof d.message === "string") return d.message;
  return d.error || e?.message || "Request failed";
}

/** Provinces */
export async function listProvinces(params?: { search?: string; page?: number; pageSize?: number }) {
  const { data } = await api.get<ListResponse<ProvinceRow>>("/province", {
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      search: params?.search || undefined,
    },
  });
  return data;
}
/** Cities */
export async function listCities(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
  provinceId?: string;
}) {
  const { data } = await api.get<ListResponse<CityRow>>("/city", {
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      search: params?.search || undefined,
      provinceId: params?.provinceId || undefined, // backend commonly supports this; if not, it's ignored
    },
  });
  return data;
}
export async function createCity(input: { name: string; provinceId: string }) {
  try {
    const { data } = await api.post<{ status: boolean; message: string; data: CityRow }>("/city", input);
    return data.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function updateCity(id: string, input: { name?: string; provinceId?: string }) {
  try {
    const { data } = await api.patch<{ status: boolean; message: string; data: CityRow }>(`/city/${id}`, input);
    return data.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function deleteCity(id: string) {
  try {
    const { data } = await api.delete<{ status: boolean; message: string }>(`/city/${id}`);
    return data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}
