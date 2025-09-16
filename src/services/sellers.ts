import api from "@/lib/api";

export type SellerRow = {
  id: string;
  userId: string;
  fullname: string;
  companyName: string;
  ktp: string;
  npwp: string;
  ktpAddress: string;
  officeAddress: string;
  createdAt: string;
  updatedAt: string;
};

export type PageMeta = { page: number; pageSize: number; total: number; pages: number };
export type ListResponse<T> = { status: boolean; message: string; data: T[]; meta: PageMeta };

function extractErrorMessage(e: any): string {
  const d = e?.response?.data;
  if (!d) return e?.message || "Request failed";
  if (Array.isArray(d.message)) return d.message.join(", ");
  if (typeof d.message === "string") return d.message;
  return d.error || e?.message || "Request failed";
}

export async function listSellers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "fullname" | "companyName";
  sortDir?: "asc" | "desc";
}) {
  const { data } = await api.get<ListResponse<SellerRow>>("/seller/all", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || undefined,
      sortBy: params.sortBy || "createdAt",
      sortDir: params.sortDir || "desc",
    },
  });
  return data;
}

// add to your existing sellers service
export type SellerDetail = SellerRow & {
  user: {
    id: string; username: string; email: string;
    phone?: string | null; level: "SELLER" | "ADMIN" | "BUYER";
    provider: string; profilePicture?: string | null;
    createdAt: string; updatedAt: string;
  };
  billboards: Array<{ id: string; location?: string | null; size?: string | null; createdAt: string }>;
};

export async function getSellerDetail(id: string) {
  const { data } = await api.get<{ status: boolean; message: string; data: SellerDetail }>(
    `/seller/detail/${id}`
  );
  return data.data;
}

// optionally, if you support deleting sellers directly
export async function deleteSeller(id: string) {
  try {
    const { data } = await api.delete<{ status: boolean; message: string }>(`/seller/id/${id}`);
    return data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

