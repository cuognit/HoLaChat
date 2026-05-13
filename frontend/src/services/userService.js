import api from "../api/axiosConfig";

export async function searchUsers(email) {
    if (!email || !email.trim()) return [];
    
    try {
        const response = await api.get(`/auth/search`, {
            params: { email: email.trim() }
        });
        return response.data?.data ?? [];
    } catch (error) {
        console.error("Search users error:", error);
        return [];
    }
}
