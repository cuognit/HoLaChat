import { Dot } from "lucide-react";
import image6 from "../../assets/image6.png";
import { useRelativeTime } from "../../hooks/useRelativeTime";
export default function HeaderChatUser({ 
    userName, 
    isOnline,
    lastActiveAt,
    userAvatar, 
    friendshipStatus, 
    friendshipSenderId, 
    currentUserId,
    isGroup,
    statusText // For group member count or fallback
}) {
    const relativeTime = useRelativeTime(lastActiveAt, "Hoạt động ");
    
    const displayStatus = isGroup 
        ? statusText 
        : (isOnline !== undefined ? (isOnline ? "Đang hoạt động" : (lastActiveAt ? relativeTime : "Không hoạt động")) : "Chưa có trạng thái");

    // Avatar
    const renderAvatar = () => {
        if (isGroup && !userAvatar) {
            // Fallback icon nhóm
            return (
                <div className="w-13 h-13 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border border-blue-300 mb-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
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
                src={userAvatar}
                alt={userName}
                className="w-13 h-13 rounded-full object-cover border border-gray-300 mb-1"
            />
        );
    };

    return (
        <div className="w-full flex items-center p-2 cursor-pointer bg-white">
            <div className="flex relative">
                {renderAvatar()}
                {!isGroup && (
                    isOnline ? (
                        <span className="absolute bottom-1 right-0 border-white border-2 w-3 h-3 bg-green-500 rounded-full"></span>
                    ) : (
                        <span className="absolute bottom-1 right-0 border-white border-2 w-3 h-3 bg-gray-400 rounded-full"></span>
                    )
                )}
            </div>
            
            <div className="flex-1 flex flex-col min-w-0 justify-center ml-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{userName}</h3>
                    
                    {/* TRẠNG THÁI PENDING: Hiện badge siêu đẹp ngay cạnh tên */}
                    {!isGroup && friendshipStatus === "PENDING" && (
                        friendshipSenderId === currentUserId ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-xs animate-pulse shrink-0">
                                Đã gửi lời mời kết bạn
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-xs animate-pulse shrink-0">
                                Lời mời kết bạn mới
                            </span>
                        )
                    )}
                    {!isGroup && friendshipStatus === "ACCEPTED" && 
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 shadow-xs shrink-0">
                            Bạn bè
                        </span>                        
                    }
                </div>
                <p className="truncate text-gray-400 flex items-center text-sm">
                    {displayStatus}
                </p>
            </div>
        </div>
    );
}