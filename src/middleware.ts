// middleware.ts (root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { navItems } from "./components/dashboard/layout/config";
// IMPORTANT: pure data file (no React imports)

type Level = "ADMIN" | "SELLER" | "BUYER";
const PUBLIC = ["/auth", "/_next", "/favicon.ico", "/assets", "/api"];

const RULES = navItems
    .filter(i => i.href && i.allowed?.length)
    .map(i => {
        const base = i.href.replace(/\/$/, "");
        return { pattern: new RegExp(`^${base}(?:/|$)`, "i"), allowed: i.allowed as Level[] };
    });

function isPublic(p: string) { return PUBLIC.some(x => p === x || p.startsWith(x + "/")); }
function findRule(p: string) { return RULES.find(r => r.pattern.test(p)); }

export async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    // DEBUG: uncomment twice to confirm it runs
    // console.log("[MW]", pathname);

    if (isPublic(pathname)) return NextResponse.next();

    // same-origin to forward cookie (needs next.config.js rewrite)
    const me = await fetch(new URL("/api/auth/me", req.url), {
        headers: { cookie: req.headers.get("cookie") ?? "" },
        cache: "no-store",
    });

    if (!me.ok) {
        const url = req.nextUrl.clone();
        url.pathname = "/auth/sign-in";
        url.searchParams.set("next", pathname + (search || ""));
        return NextResponse.redirect(url);
    }

    const { user } = (await me.json()) as { user?: { level?: Level } };
    const level = user?.level as Level | undefined;

    const rule = findRule(pathname);
    if (rule && (!level || !rule.allowed.includes(level))) {
        const url = req.nextUrl.clone();
        url.pathname = "/403";            // or "/dashboard"
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
