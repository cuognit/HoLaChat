import { Navigate } from 'react-router-dom';
    import { AuthContext } from '../context/AuthContextInstance.js';
import { useContext } from 'react';
const ProtectedRoute = ({ children }) => {
    const { accessToken } = useContext(AuthContext);
    if (!accessToken) {
        // Nếu không có token, chuyển hướng về trang login
        return <Navigate to="/login" replace />;
    }
    // Nếu có token, cho phép hiển thị nội dung bên trong (children)
    return children;
};

export default ProtectedRoute;
