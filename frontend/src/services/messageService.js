import api from "../api/axiosConfig";

export async function getMessagesByRoom(roomId, page = 0, size = 20) {
    const response = await api.get(`/messages/room/${roomId}`, {
        params: { page, size }
    });
    return response.data?.data ?? [];
}
