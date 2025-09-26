import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export async function getMeOnServer<TUser = any>(): Promise<TUser | null> {
    const cookieHeader = cookies().toString(); // forward user cookies to API
    const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: { cookie: cookieHeader },
        credentials: 'include',
        cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json().catch(() => null);
}
