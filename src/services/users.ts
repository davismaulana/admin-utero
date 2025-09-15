import api from "@/lib/api";

export type UserRow = {
    id: string;
    username: string;
    email: string;
    phone?: string | null;
    level: "ADMIN" | "MERCHANT" | "BUYER";
    provider: string;
    profilePicture?: string | null;
    createdAt: string;
    updatedAt: string;
}

export type CreateUserInput = {
    username: string;
    email: string;
    phone: string;
    level: "ADMIN" | "MERCHANT" | "BUYER";
    password: string;
    confirmPassword: string;
};

export type UpdateUserInput = Partial<CreateUserInput> & {
    password?: string
};

export type PageMeta = {
    page: number; pageSize: number; total: number; pages: number
};
export type ListResponse<T> = {
    status: boolean;
    message: string;
    data: T[];
    meta: PageMeta;
}

export async function listUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    includeMerchant?: boolean;
    sortBy?: "createdAt" | "updatedAt" | "email" | "username" | "level";
    sortDir?: "asc" | "desc";
}) {
    const res = await api.get<ListResponse<UserRow>>("/user", {
        params: {
            ...params,
            includeMerchant: params.includeMerchant ? "true" : "false",
        }
    });
    return res.data;
}

export async function listMerchants(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "email" | "username" | "level";
  sortDir?: "asc" | "desc";
}) {
  const res = await api.get<ListResponse<UserRow>>("/merchant/all", {
    params: {
      ...params,
    },
  });
  return res.data;
}

function extractErrorMessage(e: any): string {
    const d = e?.response?.data;
    if (!d) return e?.message || "Request failed";
    // Nest may send string or { message: string | string[] }
    if (Array.isArray(d.message)) return d.message.join(", ");
    if (typeof d.message === "string") return d.message;
    return d.error || e?.message || "Request failed";
}

export async function createUser(payload: CreateUserInput) {
    try {
        const fd = new FormData();
        fd.append("username", payload.username);
        fd.append("email", payload.email);
        fd.append("phone", payload.phone);
        fd.append("level", payload.level);
        fd.append("password", payload.password);
        fd.append("confirmPassword", payload.confirmPassword);

        const { data } = await api.post<{ status: boolean; message: string; data: UserRow }>(
            "/user",
            fd);

        return data.data;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }

}

export async function updateUser(id: string, payload: UpdateUserInput) {
    try {
        const fd = new FormData();
        if (payload.username != null) fd.append("username", payload.username);
        if (payload.email != null) fd.append("email", payload.email);
        if (payload.phone != null) fd.append("phone", payload.phone);
        if (payload.level != null) fd.append("level", payload.level);
        if (payload.password) fd.append("password", payload.password);
        if (payload.confirmPassword) fd.append("confirmPassword", payload.confirmPassword);

        const { data } = await api.put<{ status: boolean; message: string; data: UserRow }>(
            `/user/id/${id}`,
            fd

        );
        return data.data;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }

}

export async function deleteUser(id: string) {
    const { data } = await api.delete<{ status: boolean; message: string }>(`/user/${id}`);
    return data;
}