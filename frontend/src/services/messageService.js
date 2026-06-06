import api from "../api/axiosConfig";

export async function getMessagesByRoom(roomId, page = 0, size = 20) {
    const response = await api.get(`/messages/room/${roomId}`, {
        params: { page, size }
    });
    return response.data?.data ?? { messages: [], hasMore: false };
}

/**
 * Upload images to backend → Cloudinary.
 * @param {File[]} files - Array of image files
 * @param {object} options - { onProgress: (percent) => void, signal: AbortSignal }
 * @returns {Promise<string[]>} Array of uploaded image URLs
 */
export async function uploadImages(files, { onProgress, signal } = {}) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await api.post("/messages/upload-images", formData, {
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percent);
            }
        },
        signal,
    });

    return response.data?.data ?? [];
}

/**
 * Upload mọi loại file (image, video, file tài liệu)
 */
export async function uploadFiles(files, { onProgress, signal } = {}) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await api.post("/messages/upload-files", formData, {
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percent);
            }
        },
        signal,
    });

    return response.data?.data ?? [];
}

export async function getImagesByRoom(roomId, page = 0, size = 12) {
    const response = await api.get(`/messages/room/${roomId}/images`, {
        params: { page, size }
    });
    return response.data?.data ?? [];
}

export async function deleteMessageForMe(messageId, userId) {
    const response = await api.delete(`/messages/${messageId}/delete-for-me`, {
        params: { userId }
    });
    return response.data;
}

export async function getMessagesByRoomFiltered(roomId, userId, page = 0, size = 20) {
    const response = await api.get(`/messages/room/${roomId}/filtered`, {
        params: { userId, page, size }
    });
    return response.data?.data ?? { messages: [], hasMore: false };
}