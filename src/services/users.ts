import api from "@/lib/api";

export type Level = "ADMIN" | "BUYER" | "SELLER" | string;
export type AuthProvider = "CREDENTIALS" | "GOOGLE" | string;

export type UserRow = {
    id: string;
    username: string;
    email: string;
    phone?: string | null;
    level: Level;
    provider: AuthProvider;
    profilePicture?: string | null;
    createdAt: string;
    updatedAt: string;

    seller?: { id: string; fullname?: string | null; companyName?: string | null } | null;
    billboard?: { id: string; location?: string | null; size?: string | null; createdAt: string }[]; // optional
    transaction?: { id: string; totalPrice?: any; status?: string; createdAt: string }[]; // optional
}

export type CreateUserInput = {
    username: string;
    email: string;
    phone: string;
    level: Level;
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

export const fmtDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

function fdSet(fd: FormData, k: string, v: unknown) {
    if (v === undefined || v === null || v === "") return;
    fd.append(k, String(v));
}

function extractErrorMessage(e: any): string {
    const d = e?.response?.data;
    if (!d) return e?.message || "Request failed";
    // Nest may send string or { message: string | string[] }
    if (Array.isArray(d.message)) return d.message.join(", ");
    if (typeof d.message === "string") return d.message;
    return d.error || e?.message || "Request failed";
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

export async function getUserDetail(id: string): Promise<UserRow> {
    try {
        const { data } = await api.get<{ status: boolean; message: string; data: UserRow }>(`/user/${id}`);
        return data.data;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
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
export async function updateUser(id: string, input: UpdateUserInput) {
    try {
        const fd = new FormData();
        fdSet(fd, "username", input.username);
        fdSet(fd, "email", input.email);
        fdSet(fd, "phone", input.phone);
        fdSet(fd, "level", input.level);
        fdSet(fd, "password", input.password);
        fdSet(fd, "confirmPassword", input.confirmPassword);

        const { data } = await api.put<{ status: true; message: string; user: any }>(
            `/user/id/${id}`,
            fd,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return data.user as import("./users").UserRow;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
}

export async function updateMyProfile(input: {
    username?: string;
    email?: string;
    phone?: string;
    file?: File | null;
}) {
    const fd = new FormData();

    if (input.username) fd.append("username", input.username);
    if (input.email) fd.append("email", input.email);
    if (input.phone) fd.append("phone", input.phone);
    if (input.file) fd.append("file", input.file);

    const { data } = await api.put("/user/me", fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return data;
}

export async function updateMyPassword(payload: { password: string; confirmPassword: string }) {
    try {
        const { data } = await api.put<{ status: boolean; message?: string }>("/user/me", payload);
        if (data?.status === false) throw new Error(data?.message || "Update failed");
        return data;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
}

export async function deleteUser(id: string) {
    const { data } = await api.delete<{ status: boolean; message: string }>(`/user/${id}`);
    return data;
}