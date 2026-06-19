/**
 * File: AuthContext.jsx
 * Chức năng: Quản lý state toàn cục (Context API) của ứng dụng.
 */
import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContextInstance.js";
import { setAuthToken } from "../api/axiosConfig";
import api from "../api/axiosConfig";
import { useFirebaseMessaging } from "../hooks/useFirebaseMessaging";

export default function AuthProvider ({ children }) {
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const { requestPermission } = useFirebaseMessaging();

    // 1. Tự động lấy lại Access Token khi load trang (F5)
    useEffect(() => {
        const refreshAccessToken = async () => {
            try {
                // Sử dụng chính instance 'api' đã cấu hình sẵn withCredentials
                const response = await api.post("/auth/refresh");
                setAccessToken(response.data.data);
                setAuthToken(response.data.data);
            } catch (error) {
                console.log("No refresh token found or session expired"+error);
            } finally {
                setLoading(false);
            }
        };
        refreshAccessToken();
    }, []);

    // 2. Cập nhật token cho axios mỗi khi state thay đổi
    // và xin quyền push notification nếu đăng nhập thành công
    useEffect(() => {
        setAuthToken(accessToken);
        
        if (accessToken) {
            // Khi có token (tức là user đã login hoặc refresh token thành công),
            // xin quyền hiển thị thông báo
            requestPermission();
        }
    }, [accessToken]);

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                setAccessToken,
                loading
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

