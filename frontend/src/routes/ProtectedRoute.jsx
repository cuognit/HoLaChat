import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextInstance.js';
import { useContext } from 'react';
const ProtectedRoute = ({ children }) => {
    const { accessToken } = useContext(AuthContext);
    const location = useLocation();
    
    if (!accessToken) {
        // Nếu không có token, chuyển hướng về trang login và lưu vị trí hiện tại
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    // Nếu có token, cho phép hiển thị nội dung bên trong (children)
    return children;
};

export default ProtectedRoute;
