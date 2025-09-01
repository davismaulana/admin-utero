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
    merchant?: {id: string, fullname: string, companyName: string} | null;
}

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
    const res =  await api.get<ListResponse<UserRow>>("/user", {
        params: {
            ...params,
            includeMerchant: params.includeMerchant ? "true" : "false",
        }
    });
    return res.data;
}