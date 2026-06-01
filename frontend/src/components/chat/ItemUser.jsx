import { useState } from "react";
import api from "../../api/axiosConfig";
import { toast } from "sonner";
import image6 from "../../assets/image6.png";
export default function ItemUser({ user, onSelect, isActive = false, currentUserId, currentUserName = "Bạn", targetUserName = "User", typingUsers = [] }) {
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
    
    const isGroup = user.isGroup === true;

    // Tên hiển thị
    const displayName = isGroup
        ? (user.roomName || "Nhóm chat")
        : (user.targetUserName || targetUserName || "User");

    // Avatar
    const renderAvatar = () => {
        if (isGroup) {
            if (user.avatarUrl) {
                return (
                    <img
                        src={image6}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover border border-gray-300"
                    />
                );
            }
            // Fallback icon nhóm
            return (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border border-blue-300">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                </div>
            );
        }
        return (
            <img
                src={user.targetAvatarUrl || "/avatar.jpg"}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border border-gray-300"
            />
        );
    };

    // Last message preview
    const getLastMessagePreview = () => {
        const content = user.lastMessage || "Hãy gửi lời chào ngay!";
        const msgType = user.lastMessageType;

        // System message: in nghiêng, không prefix
        if (msgType === "SYSTEM") {
            return content;
        }

        if (!user.lastSenderId || !currentUserId) return content;

        if (isGroup) {
            // Group: "Bạn: ..." hoặc "Tên người gửi: ..."
            if (String(user.lastSenderId) === String(currentUserId)) {
                return `Bạn: ${content}`;
            }
            const senderName = user.lastSenderName || "Ai đó";
            return `${senderName}: ${content}`;
        }

        // Private
        const senderName = String(user.lastSenderId) === String(currentUserId) ? currentUserName : targetUserName;
        return `${senderName}: ${content}`;
    };

    const isSystemMsg = user.lastMessageType === "SYSTEM";
    
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
                {renderAvatar()}
                {/* Online dot: chỉ hiện cho private room */}
                {!isGroup && (
                    <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                    />
                )}
            </div>

            <div className="flex-1 flex flex-col min-w-0 justify-center">
                <div className="flex justify-between items-center">
                    <h3 className={`text-[15px] ${
                        user.unreadCount > 0 && !isActive ? "font-bold text-blue-600" : "font-semibold text-gray-800"
                    }`}>
                        {displayName}
                    </h3>
                    
                    {/* Badge số tin nhắn chưa đọc */}
                    {user.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                            {user.unreadCount > 99 ? '99+' : user.unreadCount}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between h-4 mt-0.5">
                    {typingUsers.length > 0 ? (
                        <p className="truncate text-sm max-w-[220px] text-blue-500 font-medium flex items-center gap-1">
                            <span className="flex items-center gap-0.5">
                                <span className="typing-dot-sm w-[4px] h-[4px] bg-blue-500 rounded-full inline-block" style={{ animationDelay: "0ms" }}></span>
                                <span className="typing-dot-sm w-[4px] h-[4px] bg-blue-500 rounded-full inline-block" style={{ animationDelay: "150ms" }}></span>
                                <span className="typing-dot-sm w-[4px] h-[4px] bg-blue-500 rounded-full inline-block" style={{ animationDelay: "300ms" }}></span>
                            </span>
                            <span className="ml-0.5">
                                {user.isGroup && typingUsers.length === 1
                                    ? `${typingUsers[0].userName} đang nhập`
                                    : user.isGroup
                                    ? `${typingUsers.length} người đang nhập`
                                    : "Đang nhập"}
                            </span>
                        </p>
                    ) : (
                        <p className={`truncate text-sm max-w-[220px] ${
                            isSystemMsg ? "italic text-gray-400" :
                            user.unreadCount > 0 && !isActive ? "font-normal text-gray-700" : "text-gray-400"
                        }`}>
                            {getLastMessagePreview()}
                        </p>
                    )}
                    <div className="flex flex-col items-end mt-3">
                        <p className={`text-[10px] ${
                            user.unreadCount > 0 && !isActive ? "font-bold text-blue-600" : "text-gray-400"
                        }`}>
                            {lastMessageTime}
                        </p>
                    </div>
                </div>

                {/* Số thành viên cho group
                {isGroup && user.memberCount > 0 && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                        {user.memberCount} thành viên
                    </p>
                )} */}
            </div>
        </div>
    );
}