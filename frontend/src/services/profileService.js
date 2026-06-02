import api from "../api/axiosConfig";
import axios from "axios"; 
import { compressImage } from "../utils/imageCompressor";


const CLOUDINARY_UPLOAD_URL = import.meta.env.VITE_CLOUDINARY_UPLOAD_URL;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function updateProfileText(data) {
    const response = await api.put("/auth/profile/update", data);
    return response.data?.data;
}

export async function uploadAvatar(file) {
    // Nén ảnh trước khi upload
    const compressedFile = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 });

    // 1. Upload ảnh trực tiếp từ client lên Cloudinary CDN
    const formData = new FormData();
    formData.append("file", compressedFile);
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
    // Nén ảnh trước khi upload
    const compressedFile = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 });

    // 1. Upload ảnh trực tiếp từ client lên Cloudinary CDN
    const formData = new FormData();
    formData.append("file", compressedFile);
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