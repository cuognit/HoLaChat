/**
 * File: GuestRoute.jsx
 * Chức năng: Cấu hình điều hướng (routing) của ứng dụng.
 */
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextInstance.js';
import { useContext } from 'react';
const GuestRoute = ({ children }) => {
    const { accessToken } = useContext(AuthContext);
    if(accessToken){
        return <Navigate to="/" replace />;
    }
    return children;
};

export default GuestRoute;