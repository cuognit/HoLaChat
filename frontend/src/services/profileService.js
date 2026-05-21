import api from "../api/axiosConfig";
import axios from "axios"; // Dùng axios mặc định để không đính kèm token của app khi gọi lên Cloudinary

// Lấy thông tin từ application.yaml của bạn
const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dkdzpx1b0/image/upload";
const UPLOAD_PRESET = "hola_chat_preset"; // Tên Preset bạn vừa tạo ở Bước 1

export async function updateProfileText(data) {
    const response = await api.put("/auth/profile/update", data);
    return response.data?.data;
}

export async function uploadAvatar(file) {
    // 1. Upload ảnh trực tiếp từ client lên Cloudinary CDN
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "hola_chat/avatars");

    const cloudinaryResponse = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    const secureUrl = cloudinaryResponse.data.secure_url;

    // 2. Gửi link URL vừa nhận được về backend Spring Boot để lưu vào Postgres DB
    const response = await api.put("/auth/profile/avatar", null, {
        params: {
            avatarUrl: secureUrl
        }
    });
    return response.data?.data;
}

export async function uploadCover(file) {
    // 1. Upload ảnh trực tiếp từ client lên Cloudinary CDN
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "hola_chat/covers");

    const cloudinaryResponse = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    const secureUrl = cloudinaryResponse.data.secure_url;

    // 2. Gửi link URL vừa nhận được về backend Spring Boot để lưu vào Postgres DB
    const response = await api.put("/auth/profile/cover", null, {
        params: {
            coverUrl: secureUrl
        }
    });
    return response.data?.data;
}