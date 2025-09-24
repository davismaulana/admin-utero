import api from "@/lib/api";

// ---- Types ----
export type NotificationEntity = "TRANSACTION" | "BILLBOARD" | string;
export type NotificationStatus = "UNREAD" | "READ";

export type NotifAuthor = {
    id: string;
    username?: string | null;
    profilePicture?: string | null;
};

export type NotificationRow = {
    id: string;
    title: string;
    message: string;
    entity: NotificationEntity;
    entityId?: string | null;
    status: NotificationStatus;
    createdAt: string;
    readAt?: string | null;
    createdBy?: NotifAuthor | null;
};

export type PageMeta = { page: number; pageSize: number; total: number; pages: number };
export type ListResponse<T> = { status?: boolean; message?: string; data: T[]; meta?: PageMeta };

export type ListNotificationParams = {
    page?: number;
    pageSize?: number;
    status?: NotificationStatus; // optional filter
};

export type CreateNotificationInput = {
    recipientId: string;
    entity: NotificationEntity;
    entityId?: string;
    title: string;
    message: string;
};

// shared formatters
export const fmtDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

function extractErrorMessage(e: any): string {
    const d = e?.response?.data;
    if (!d) return e?.message || "Request failed";
    if (Array.isArray(d.message)) return d.message.join(", ");
    if (typeof d.message === "string") return d.message;
    return d.error || e?.message || "Request failed";
}

// ---- API calls ----
export async function listMyNotifications(params: ListNotificationParams = {}) {
    try {
        const { data } = await api.get<ListResponse<NotificationRow>>("/notification/me", {
            params: {
                page: params.page ?? 1,
                pageSize: params.pageSize ?? 10,
                status: params.status || undefined,
            },
        });
        // Some backends return {status, message, data, meta}; keep both safe:
        return { data: data.data ?? [], meta: (data as any).meta as PageMeta | undefined };
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
}

export async function getUnreadCount() {
    try {
        const { data } = await api.get<{ status: boolean; count: number }>("/notification/me/unread-count");
        return data.count ?? 0;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
}

export async function markNotificationRead(id: string) {
    try {
        const { data } = await api.patch<{ status: boolean; updated?: number }>(`/notification/${id}/read`, {});
        return data;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
}

export async function markAllNotificationsRead() {
    try {
        const { data } = await api.patch<{ status: boolean; updated?: number }>(`/notification/read-all`, {});
        return data;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
}

export async function createNotification(input: CreateNotificationInput) {
    try {
        const { data } = await api.post<{ status: boolean; data: NotificationRow }>(`/notification`, input);
        return data.data;
    } catch (e) {
        throw new Error(extractErrorMessage(e));
    }
}
