export type Role = "ADMIN" | "SELLER" | "BUYER";

export enum Permission {
    OverviewRead = "overview:read",

    UsersRead = "users:read",
    UsersWrite = "users:write",

    SellersRead = "sellers:read",

    CategoriesRead = "categories:read",
    DesignsRead = "designs:read",

    BillboardsRead = "billboards:read",
    BillboardCreate = "billboard:create",   // seller-only action (UI buttons etc.)
    BillboardDelete = "billboard:delete",

    RecommendationRead = "recommendation:read",

    LocationsRead = "locations:read",
    TransactionsRead = "transactions:read",

    RecycleRead = "recycle:read",
    GalleriesRead = "galleries:read",
}

// Map roles → permissions (central place to tweak policy)
const ROLE_PERMS: Record<Role, Permission[]> = {
    ADMIN: [
        Permission.OverviewRead,
        Permission.UsersRead, Permission.UsersWrite,
        Permission.SellersRead,
        Permission.CategoriesRead,
        Permission.DesignsRead,
        Permission.BillboardsRead, Permission.BillboardDelete,  // admin can manage
        Permission.LocationsRead,
        Permission.TransactionsRead,
        Permission.RecycleRead,
        Permission.GalleriesRead,
        Permission.RecommendationRead
    ],
    SELLER: [
        Permission.OverviewRead,
        Permission.SellersRead,           // e.g., own seller page/readonly lists
        Permission.DesignsRead,
        Permission.BillboardsRead,
        Permission.BillboardCreate,       // seller can create
        Permission.LocationsRead,
    ],
    BUYER: [
        Permission.OverviewRead,
    ],
};

export function can(role: Role | undefined, perm: Permission): boolean {
    if (!role) return false;
    return ROLE_PERMS[role]?.includes(perm) ?? false;
}

// Helper for gate objects (anyOf / allOf)
export type Gate = { anyOf?: Permission[]; allOf?: Permission[] };

export function canGate(role: Role | undefined, gate?: Gate): boolean {
    if (!gate) return true; // no restriction
    if (gate.allOf?.length) {
        return gate.allOf.every((p) => can(role, p));
    }
    if (gate.anyOf?.length) {
        return gate.anyOf.some((p) => can(role, p));
    }
    return true;
}
