
export default function ItemUser({ user, onSelect, isActive = false, currentUserId, currentUserName = "Bạn", targetUserName = "User" }) {
    const isOnline = user.isOnline ?? false;
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
        const content = user.lastMessage || "Chua co tin nhan";
        
        if (!user.lastSenderId || !currentUserId) {
            return content;
        }
        const senderName = user.lastSenderId === currentUserId ? currentUserName : targetUserName;
         if(senderName === currentUserName){
            return `Bạn: ${content}`;
        }
        return `${senderName}: ${content}`;
    };
    
    return (
        <div
            onClick={() => onSelect(user)}
            className={`${isActive ? "bg-blue-50" : "bg-white hover:bg-gray-100"} w-full flex items-center gap-4 p-2 rounded-md cursor-pointer transition-colors`}
        >
            <div className="relative">
                <img
                    src={user.targetAvatarUrl || "/avatar.jpg"}
                    alt={user.targetUserName || "User"}
                    className="w-12 h-12 rounded-full object-cover border border-gray-300"
                />
                {/* Trạng thái online/offline indicator */}
                <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                />
            </div>
            <div className={`flex-1 flex flex-col min-w-0 justify-center`}>
                <div className="flex justify-between items-center gap-2">
                    <h3 className="text-lg font-medium">{user.targetUserName || "Chua co ten"}</h3>
                    {user.unreadCount > 0 && (
                            <span className=" bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {user.unreadCount > 99 ? '99+' : user.unreadCount}
                            </span>
                        )}
                </div>
                <div className="flex items-center justify-between mt-1">
                    <p className="truncate text-gray-400 text-sm max-w-[150px]">{getLastMessagePreview()}</p>
                    <div className="flex flex-col items-end gap-1">
                        <p className="text-xs text-gray-400">{lastMessageTime}</p>
                       
                    </div>
                </div>
            </div>
        </div>
    );
}
