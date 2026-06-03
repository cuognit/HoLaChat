import api from "../api/axiosConfig";

export async function getMessagesByRoom(roomId, page = 0, size = 20) {
    const response = await api.get(`/messages/room/${roomId}`, {
        params: { page, size }
    });
    return response.data?.data ?? [];
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

export async function getImagesByRoom(roomId, page = 0, size = 12) {
    const response = await api.get(`/messages/room/${roomId}/images`, {
        params: { page, size }
    });
    return response.data?.data ?? [];
}
