import api from "@/lib/api";

export type Profile = {
    id: string;
    username: string;
    email: string;
    phone: string;
    level?: "ADMIN" | "MERCHANT" | "BUYER";
    profilePicture: string;
};

export async function getMyProfile(): Promise<Profile> {
    const {data} = await api.get<{user: Profile}>("user/profile/me");
    return data.user
}