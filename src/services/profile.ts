import api from "@/lib/api";

export type Profile = {
    id: string;
    username: string;
    email: string;
    phone: string;
    level?: "ADMIN" | "SELLER" | "BUYER"; // align with your Prisma enum
    profilePicture: string | null;        // can be null on new accounts
};

export async function getMyProfile(): Promise<Profile> {
    // 👇 leading slash so this becomes /api/user/profile/me
    const { data } = await api.get<{ user: Profile }>("/user/profile/me");
    return data.user;
}