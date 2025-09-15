import api from "@/lib/api";

export type CategoryRow = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
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
    meta: PageMeta;
};

function extractErrorMessage(e: any): string {
    const d = e?.response?.data;
    if (!d) return e?.message || "Request failed";
    if (Array.isArray(d.message)) return d.message.join(", ");
    if (typeof d.message === "string") return d.message;
    return d.error || e?.message || "Request failed";
}

export async function listCategories(params: {
    page?: number;
    pageSize?: number;
    search?: string;
}) {
    const { data } = await api.get<ListResponse<CategoryRow>>("/category", {
        params: {
            page: params.page,
            pageSize: params.pageSize,
            search: params.search || undefined,
        },
    });
    return data;
}

export async function createCategory(payload: { name: string }) {
    try {
        const { data } = await api.post<{ status: boolean; message: string; data: CategoryRow }>(
            "/category",
            payload // JSON body: { name }
        );
        return data.data;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
}

export async function updateCategory(id: string, payload: { name: string }) {
    try {
        // If your API is /category/:id instead, change to `/category/${id}`
        const { data } = await api.patch<{ status: boolean; message: string; data: CategoryRow }>(
            `/category/${id}`,
            payload
        );
        return data.data;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
}

export async function deleteCategory(id: string) {
    // If your API is /category/:id instead, change to `/category/${id}`
    const { data } = await api.delete<{ status: boolean; message: string }>(`/category/${id}`);
    return data;
}
