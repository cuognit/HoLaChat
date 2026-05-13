import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContextInstance.js";
import { setAuthToken } from "../api/axiosConfig";
import api from "../api/axiosConfig";

export default function AuthProvider ({ children }) {
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

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
    useEffect(() => {
        setAuthToken(accessToken);
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

