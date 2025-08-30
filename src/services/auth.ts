"use client";

import api from "@/lib/api";


export type LoginPayload = {
    identifier: string;
    password: string;
}

export type LoginResponse = {
    accessToken?: string;
    refreshToken?: string;
    user?: {
        id: string, name?: string, email?: string; phone?: string
    };
    message?: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/auth/login", payload);
    return res.data;
}