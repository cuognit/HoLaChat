import { Dot } from "lucide-react";

export default function HeaderChatUser({ 
    userName, 
    status, 
    userAvatar, 
    friendshipStatus, 
    friendshipSenderId, 
    currentUserId 
}) {
    return (
        <div className="w-full flex items-center p-2 cursor-pointer bg-white">
            <div className="flex relative">
                <img
                    src={userAvatar}
                    alt={userName}
                    className="w-13 h-13 rounded-full object-cover border border-gray-300 mb-1"
                />
                {status === "Đang hoạt động" ? (
                    <span className="relative -left-3 top-9 border-white border-2 w-3 h-3 bg-green-400 rounded-full me-1"></span>
                ) : (
                    <span className="relative -left-3 top-9 border-white border-2 w-3 h-3 bg-gray-400 rounded-full me-1"></span>
                )}
            </div>
            
            <div className="flex-1 flex flex-col min-w-0 justify-center">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{userName}</h3>
                    
                    {/* TRẠNG THÁI PENDING: Hiện badge siêu đẹp ngay cạnh tên */}
                    {friendshipStatus === "PENDING" && (
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
                    {friendshipStatus === "ACCEPTED" && 
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 shadow-xs shrink-0">
                                Bạn bè
                            </span>                        
                    }
                </div>
                <p className="truncate text-gray-400 flex items-center text-sm">
                    {status}
                </p>
            </div>
        </div>
    );
}