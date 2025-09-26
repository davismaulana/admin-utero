import { useUser } from "@/hooks/use-user"; // you already have this
import { can, hasRole, type Permission, type Role } from "@/lib/gate";

export function useGate() {
    const { user } = useUser(); // assume user?.level is the role string
    const role = (user?.level ?? null) as Role | null;

    return {
        role,
        hasRole: (allowed: Role[] | Role) => hasRole(role, allowed),
        can: (perm: Permission) => can(role, perm),
    };
}
