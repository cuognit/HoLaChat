import axios from 'axios';


// 1. Tạo một instance riêng để không ảnh hưởng đến các request khác nếu cần
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true // gửi kèm Cookie Refresh Token
});

let accessToken = null;

export const setAuthToken = (token) => {
    accessToken = token;
};

export const getAuthToken = () => accessToken;

// 2. Request Interceptor: Tự động đính Token vào mọi yêu cầu gửi đi
api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 3. Response Interceptor: Kiểm tra lỗi từ Backend trả về
api.interceptors.response.use(
    (response) => response, 
    async (error) => {
        const originalRequest = error.config;

        // Nếu Backend trả về 401 và chưa từng thử refresh cho request này
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Gọi API refresh để lấy Access Token mới
                const res = await axios.post("http://localhost:8080/api/auth/refresh", {}, {
                    withCredentials: true
                });
                const newAccessToken = res.data.data;
                
                // Cập nhật token mới vào biến cục bộ và retry request cũ
                setAuthToken(newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Nếu refresh cũng lỗi (hết hạn hoàn toàn) thì đá về login
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
