import { useState } from "react";
import api from "../../api/axiosConfig";
import { toast } from "sonner";

export default function ItemUser({ user, onSelect, isActive = false, currentUserId, currentUserName = "Bạn", targetUserName = "User" }) {
    const isOnline = user.isOnline ?? false;
    const [actionLoading, setActionLoading] = useState(false);

    const formatLastMessageTime = (time) => {
        if (!time) return "";

        const date = new Date(time);
        const now = new Date();

        const isToday =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        if (isToday) {
            return date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return date.toLocaleDateString([], {
                day: '2-digit',
                month: '2-digit'
            });
        }
    };

    const lastMessageTime = user.lastMessageTime ? formatLastMessageTime(user.lastMessageTime) : "";
    
    // Xác định ai gửi message cuối cùng
    const getLastMessagePreview = () => {
        const content = user.lastMessage || "Hãy gửi lời chào ngay!";
        
       
        if (!user.lastSenderId || !currentUserId) {
            return content;
        }
        const senderName = user.lastSenderId === currentUserId ? currentUserName : targetUserName;
        if (senderName === currentUserName) {
            return `Bạn: ${content}`;
        }
        return `${senderName}: ${content}`;
    };
    
    return (
        <div
            onClick={() => onSelect(user)}
            className={`${
                isActive 
                    ? "bg-blue-100 text-blue-700 border-1 border-blue-500" 
                    : user.unreadCount > 0 
                        ? "bg-sky-100 border-blue-700" 
                        : "bg-white "
            } w-full flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors mb-1 hover:bg-gray-50`}
        >
            <div className="relative">
                <img
                    src={user.targetAvatarUrl || "/avatar.jpg"}
                    alt={user.targetUserName || "User"}
                    className="w-12 h-12 rounded-full object-cover border border-gray-300"
                />
                {/* Trạng thái online/offline */}
                <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                />
            </div>
            <div className="flex-1 flex flex-col min-w-0 justify-center">
                <div className="flex justify-between items-center">
                    <h3 className={`text-[15px] ${
                        user.unreadCount > 0 && !isActive ? "font-bold text-blue-600" : "font-semibold text-gray-800"
                    }`}>
                        {user.targetUserName || "Chưa có tên"}
                    </h3>
                    
                    {/* Badge số tin nhắn chưa đọc đỏ nổi bật */}
                    {user.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                            {user.unreadCount > 99 ? '99+' : user.unreadCount}
                        </span>
                    )}
                </div>

                {/* Nội dung tin nhắn cuối cùng và thời gian */}
                <div className="flex items-center justify-between h-4 mt-0.5">
                    <p className={`truncate text-sm max-w-[220px] ${
                        user.unreadCount > 0 && !isActive ? "font-normal text-gray-700" : "text-gray-400"
                    }`}>
                        {getLastMessagePreview()}
                    </p>
                    <div className="flex flex-col items-end mt-3">
                        <p className={`text-[10px] ${
                            user.unreadCount > 0 && !isActive ? "font-bold text-blue-600" : "text-gray-400"
                        }`}>
                            {lastMessageTime}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}