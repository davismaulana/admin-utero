import api from "@/lib/api";

// ---- Types ----
export type TransactionStatus =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type PageMeta = { page: number; pageSize: number; total: number; pages: number };
export type ListResponse<T> = { status?: boolean; message?: string; data: T[]; meta?: PageMeta };

export type MiniUser = {
  id: string;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type Seller = {
  id: string;
  userId: string;
  fullname?: string | null;
  companyName?: string | null;
};

export type BillboardMini = {
  id: string;
  location?: string | null;
  cityName?: string | null;
  provinceName?: string | null;
  mode?: "Buy" | "Rent";
};

export type AddOn = { id: string; name: string; price?: number | string | null };
export type TxAddOn = { id: string; transactionId: string; addOnId: string; addOn: AddOn };

export type TransactionRow = {
  id: string;
  buyerId: string;
  sellerId: string;
  billboardId: string;
  designId?: string | null;

  status: TransactionStatus;
  totalPrice: number | string; // prisma decimal can serialize to string
  startDate: string;           // ISO
  endDate?: string | null;     // ISO or null

  createdAt: string;
  updatedAt: string;

  // includes from service.findAll()
  buyer?: MiniUser | null;
  seller?: Seller | null;
  design?: { id: string; name: string } | null;
  billboard?: BillboardMini | null;
  addons?: TxAddOn[] | null;
};

export type TransactionDetail = TransactionRow & {
  transactionHistory?: {
    id: string;
    transactionId: string;
    pricing?: any; // snapshot (currency, prices, addOns, period, billboard, design)
    createdAt: string;
    updatedAt: string;
  } | null;
  rating?: { id: string; rating: number; comment?: string | null } | null;
};

export type DetailResponse = { status: boolean; message: string; data: TransactionDetail };

// ---- helpers reused by UI ----
export const idrFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
export const fmtDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function parseIDR(v?: string | number | null): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export type BulkDeleteInput = {
  ids?: string[];
  status?: TransactionStatus;   // optional server-side filter
  before?: string;              // ISO date string: delete createdAt < before
};

function extractErrorMessage(e: any): string {
  const d = e?.response?.data;
  if (!d) return e?.message || "Request failed";
  if (Array.isArray(d.message)) return d.message.join(", ");
  if (typeof d.message === "string") return d.message;
  return d.error || e?.message || "Request failed";
}

// ---- API calls ----
export async function listAllTransactions(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TransactionStatus | "";
  sortBy?: "createdAt" | "updatedAt" | "totalPrice" | "startDate" | "endDate";
  sortDir?: "asc" | "desc";
}) {
  try {
    const { data } = await api.get<ListResponse<TransactionRow>>("/transaction/all", {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
        status: params.status || undefined,
        sortBy: params.sortBy || "createdAt",
        sortDir: params.sortDir || "desc",
      },
    });
    return data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function getTransactionDetail(id: string) {
  try {
    const { data } = await api.get<DetailResponse>(`/transaction/detail/${id}`);
    return data.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function updateTransactionStatus(id: string, status: TransactionStatus) {
  try {
    const { data } = await api.patch<{ status: boolean; message: string; data: TransactionDetail }>(
      `/transaction/${id}`,
      { status }
    );
    return data.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function deleteTransaction(id: string) {
  try {
    const { data } = await api.delete<{ status: boolean; message: string }>(`/transaction/${id}`);
    if (data && data.status === false) throw new Error(data.message || "Delete failed");
    return data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function bulkDeleteTransactions(input: BulkDeleteInput) {
  try {
    const { data } = await api.delete<{
      status: boolean;
      message: string;
      targetCount: number;
      deleted: { ratings: number; addOns: number; histories: number; transactions: number };
    }>("/transaction", { data: input }); // axios supports body on DELETE via `data`
    return data;
  } catch (e: any) {
    const d = e?.response?.data;
    const msg =
      (Array.isArray(d?.message) ? d.message.join(", ") : d?.message) ||
      d?.error ||
      e?.message ||
      "Failed to bulk-delete transactions";
    throw new Error(msg);
  }
}
