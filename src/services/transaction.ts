// src/services/transactions.ts
import api from "@/lib/api";

export type TransactionStatus =
  | "PENDING" | "PAID" | "EXPIRED" | "REJECTED" | "CANCELLED" | "COMPLETED";

export type TransactionRow = {
  id: string;
  buyerId: string;
  merchantId: string;
  billboardId: string;
  designId?: string | null;
  payment?: string | null;
  status: TransactionStatus;
  totalPrice: string; // Prisma Decimal -> string
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;

  // backend usually includes relations; if not, show raw ids
  buyer?: { id: string; username?: string; email?: string } | null;
  merchant?: { id: string; storeName?: string; userId?: string } | null;
  design?: { id: string; name?: string } | null;
  billboard?: { id: string; location?: string; size?: string } | null;
};

export type PageMeta = { page: number; pageSize: number; total: number; pages: number };

export type ListResponse<T> = {
  status: boolean;
  message: string;
  data: T[];
  meta: PageMeta;
};

function extractErrorMessage(e: any): string {
  const d = e?.response?.data;
  if (!d) return e?.message || "Request failed";
  if (Array.isArray(d.message)) return d.message.join(", ");
  if (typeof d.message === "string") return d.message;
  return d.error || e?.message || "Request failed";
}

// -------- Lists --------

// Admin – all transactions
export async function listTransactionsAll(params: {
  page?: number; pageSize?: number; search?: string;
  status?: TransactionStatus | ""; sortBy?: string; sortDir?: "asc" | "desc";
}) {
  const { data } = await api.get<ListResponse<TransactionRow>>("/transaction/all", {
    params: {
      page: params.page, pageSize: params.pageSize, search: params.search || undefined,
      status: params.status || undefined, sortBy: params.sortBy, sortDir: params.sortDir,
    },
  });
  return data;
}

// Buyer – myTransactions
export async function listTransactionsMine(params: {
  page?: number; pageSize?: number; search?: string;
  status?: TransactionStatus | ""; sortBy?: string; sortDir?: "asc" | "desc";
}) {
  const { data } = await api.get<ListResponse<TransactionRow>>("/transaction/myTransactions", {
    params: {
      page: params.page, pageSize: params.pageSize, search: params.search || undefined,
      status: params.status || undefined, sortBy: params.sortBy, sortDir: params.sortDir,
    },
  });
  return data;
}

// Merchant – mySales
export async function listTransactionsSales(params: {
  page?: number; pageSize?: number; search?: string;
  status?: TransactionStatus | ""; sortBy?: string; sortDir?: "asc" | "desc";
}) {
  const { data } = await api.get<ListResponse<TransactionRow>>("/transaction/mySales", {
    params: {
      page: params.page, pageSize: params.pageSize, search: params.search || undefined,
      status: params.status || undefined, sortBy: params.sortBy, sortDir: params.sortDir,
    },
  });
  return data;
}

// -------- Detail --------
export async function getTransaction(id: string) {
  const { data } = await api.get<{ status: boolean; message: string; data: TransactionRow }>(
    `/transaction/detail/${id}`
  );
  return data.data;
}

// -------- Admin actions --------
export async function updateTransactionStatus(id: string, status: TransactionStatus) {
  try {
    const { data } = await api.patch<{ status: boolean; message: string; data: TransactionRow }>(
      `/transaction/${id}`, { status }
    );
    return data.data;
  } catch (e) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function deleteTransaction(id: string) {
  const { data } = await api.delete<{ status: boolean; message: string }>(`/transaction/${id}`);
  return data;
}
