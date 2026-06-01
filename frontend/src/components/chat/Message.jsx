import { CheckCircle2, ThumbsUp, Quote, Forward, MoreHorizontal } from "lucide-react";

export default function Message({ 
    content, 
    whoSend, 
    time, 
    avatar, 
    targetAvatarUrl, 
    showSeenAvatar, 
    showSentStatus, 
    seenByUsers = [],
    previousMessageCreatedAt, 
    currentMessageCreatedAt, 
    nextMessageCreatedAt, 
    currentSenderId, 
    nextMessageSenderId, 
    previousSenderId,
    messageType, 
    senderName, 
    isGroup 
}) {
    
    // Nếu là tin nhắn hệ thống
    if (messageType === 'SYSTEM') {
        return (
            <div className="w-full flex justify-center my-3">
                <span className="text-xs text-gray-500 italic bg-gray-200/50 px-3 py-1.5 rounded-full font-medium">
                    {content}
                </span>
            </div>
        );
    }

    // Helper parse date an toàn xử lý cả ISO string từ local message và định dạng server "YYYY-MM-DD HH:mm:ss"
    const safeParseDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            if (dateStr.includes('T') || dateStr.includes('Z')) {
                return new Date(dateStr);
            }
            return new Date(dateStr.replace(" ", "T"));
        } catch (e) {
            return null;
        }
    };

    // Kiểm tra xem tin nhắn hiện tại có phải là tin nhắn cuối cùng trong chuỗi nhắn tin liên tiếp của người đó không
    const isLastInConsecutiveGroup = () => {
        // Nếu không có tin nhắn tiếp theo (mới hơn), nó là tin nhắn cuối cùng của cuộc trò chuyện
        if (!nextMessageCreatedAt || !nextMessageSenderId) return true;
        
        // So sánh an toàn ép kiểu về String tránh lỗi kiểu String vs Number
        if (String(nextMessageSenderId) !== String(currentSenderId)) return true;
        
        // Nếu cùng người gửi nhưng tin nhắn tiếp theo cách hơn 1 phút
        try {
            const currentTime = safeParseDate(currentMessageCreatedAt);
            const nextTime = safeParseDate(nextMessageCreatedAt);
            if (!currentTime || !nextTime) return true;

            const diffMinutes = Math.abs(nextTime.getTime() - currentTime.getTime()) / (1000 * 60);
            return diffMinutes > 1;
        } catch (error) {
            return true;
        }
    };

    // Kiểm tra xem tin nhắn hiện tại có phải là liên tiếp của cùng người gửi trong 1 phút không
    const isConsecutive = () => {
        if (!previousMessageCreatedAt || !currentMessageCreatedAt || !previousSenderId || !currentSenderId) return false;
        if (String(previousSenderId) !== String(currentSenderId)) return false;
        
        try {
            const currentTime = safeParseDate(currentMessageCreatedAt);
            const prevTime = safeParseDate(previousMessageCreatedAt);
            if (!currentTime || !prevTime) return false;

            const diffMinutes = Math.abs(currentTime.getTime() - prevTime.getTime()) / (1000 * 60);
            return diffMinutes <= 1; // Nhỏ hơn hoặc bằng 1 phút
        } catch (error) {
            console.error('Consecutive comparison error:', error);
            return false;
        }
    };

    // Tính khoảng cách dựa trên thời gian và người gửi
    const getMarginTop = () => {
        if (!previousMessageCreatedAt || !currentMessageCreatedAt || !previousSenderId || !currentSenderId) return 'mt-4'; // Default
        
        // Nếu là tin nhắn của 2 người khác nhau -> luôn cách nhau mt-6
        if (String(previousSenderId) !== String(currentSenderId)) {
            return 'mt-6';
        }
        
        try {
            const currentTime = safeParseDate(currentMessageCreatedAt);
            const prevTime = safeParseDate(previousMessageCreatedAt);
            if (!currentTime || !prevTime) return 'mt-6';

            const diffMinutes = Math.abs(currentTime.getTime() - prevTime.getTime()) / (1000 * 60);
            
            // Nếu cùng người gửi và cách nhau <= 1 phút: margin nhỏ
            if (diffMinutes <= 1) {
                return 'mt-1';
            }
            // Nếu cùng người gửi nhưng cách nhau > 1 phút: margin lớn
            else {
                return 'mt-6';
            }
        } catch (error) {
            console.error('Time comparison error:', error);
            return 'mt-6';
        }
    };

    // Kiểm tra có nên hiển thị time không
    const shouldShowTime = () => {
        if (!nextMessageCreatedAt) return true;
        if (String(currentSenderId) !== String(nextMessageSenderId)) return true;
        
        if (String(currentSenderId) === String(nextMessageSenderId) && nextMessageCreatedAt) {
            try {
                const currentTime = safeParseDate(currentMessageCreatedAt);
                const nextTime = safeParseDate(nextMessageCreatedAt);
                if (!currentTime || !nextTime) return true;

                const diffMinutes = Math.abs(nextTime.getTime() - currentTime.getTime()) / (1000 * 60);
                return diffMinutes > 1;
            } catch (error) {
                console.error('Time comparison error:', error);
                return true;
            }
        }
        return false;
    };

    const isSentByMe = whoSend === 'self-end';

    // Chỉ hiển thị tên người gửi trong nhóm nếu không phải tin nhắn của mình và không phải tin nhắn liên tiếp
    const shouldShowSenderName = isGroup && !isSentByMe && senderName && !isConsecutive();

    return (
        <div className={`flex items-start gap-2 w-full ${getMarginTop()} ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
            {/* Hiển thị avatar đối phương: Nếu liên tiếp thì ẩn ảnh đi nhưng giữ khoảng trống w-10 để tin nhắn thẳng hàng */}
            {!isSentByMe && (
                isConsecutive() ? (
                    <div className="w-10 h-10 shrink-0" />
                ) : (
                    <img
                        src={avatar || "/notfound.png"}
                        className="w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer shrink-0"
                        alt=""
                    />
                )
            )}

            <div className={`flex flex-col flex-1 max-w-[85%] ${isSentByMe ? 'items-end' : 'items-start'}`}>
                {/* Hàng chứa Bong bóng tin nhắn + 3 Options bên cạnh */}
                <div className={`flex items-center gap-2 group/msg relative ${isSentByMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Bong bóng tin nhắn */}
                    <div className={`relative px-4 py-1 rounded-2xl shadow-sm border max-w-lg transition-all duration-150 ${
                        isSentByMe 
                            ? 'bg-blue-50 text-blue-950 border-blue-200/50 hover:bg-blue-100/60' 
                            : 'bg-white text-gray-800 border-gray-100 hover:bg-gray-50/70'
                    }`}>
                        {shouldShowSenderName && (
                            <p className="text-[11px] font-semibold text-orange-600 mb-0.5 select-none">{senderName}</p>
                        )}
                        <p className="wrap-break-word whitespace-pre-wrap leading-relaxed text-[14.5px]">{content}</p>
                        
                        {shouldShowTime() && (
                            <p className={`text-[10px] text-gray-400 mt-2 select-none ${isSentByMe ? 'text-left' : 'text-right'}`}>
                                {time}
                            </p>
                        )}

                        {/* Nút Like rỗng & Popover Cảm xúc nổi: Chỉ hiển thị ở tin nhắn cuối của chuỗi liên tiếp */}
                        {isLastInConsecutiveGroup() && (
                            <div className={`absolute -bottom-3 ${isSentByMe ? '-left-1' : '-right-1'} z-20 group/like`}>
                                <button className="flex items-center justify-center w-5 h-5 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-500 rounded-full border border-gray-200 shadow-sm transition-all duration-150 cursor-pointer active:scale-90">
                                    <ThumbsUp className="w-3 h-3 stroke-[2.5]" />
                                </button>
                                
                                {/* Thanh Emoji trượt lên khi hover vào nút Like */}
                                <div className={`absolute bottom-full mb-0 hidden group-hover/like:flex items-center gap-2 px-2.5 py-1 bg-white border border-gray-100 rounded-full shadow-lg z-30 animate-in fade-in slide-in-from-bottom-1 duration-150 select-none ${isSentByMe ? 'right-0 origin-bottom-left' : 'left-0 origin-bottom-right'}`}>
                                    <span className="text-xl hover:scale-135 transition-transform duration-100 cursor-pointer origin-bottom active:scale-95 hover:filter hover:drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" title="Thích">👍</span>
                                    <span className="text-xl hover:scale-135 transition-transform duration-100 cursor-pointer origin-bottom active:scale-95 hover:filter hover:drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" title="Yêu thích">❤️</span>
                                    <span className="text-xl hover:scale-135 transition-transform duration-100 cursor-pointer origin-bottom active:scale-95 hover:filter hover:drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" title="Haha">😆</span>
                                    <span className="text-xl hover:scale-135 transition-transform duration-100 cursor-pointer origin-bottom active:scale-95 hover:filter hover:drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" title="Wow">😮</span>
                                    <span className="text-xl hover:scale-135 transition-transform duration-100 cursor-pointer origin-bottom active:scale-95 hover:filter hover:drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" title="Buồn">😭</span>
                                    <span className="text-xl hover:scale-135 transition-transform duration-100 cursor-pointer origin-bottom active:scale-95 hover:filter hover:drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]" title="Phẫn nộ">😡</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3 Nút Options (Trả lời, Chia sẻ, Thêm) bên cạnh */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/msg:pointer-events-auto">
                        <button 
                            className="flex items-center justify-center w-7 h-7 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-gray-700 rounded-full border border-gray-200 shadow-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95" 
                            title="Trả lời"
                        >
                            <Quote className="w-3.5 h-3.5 fill-current rotate-180" />
                        </button>
                        <button 
                            className="flex items-center justify-center w-7 h-7 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-gray-700 rounded-full border border-gray-200 shadow-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95" 
                            title="Chia sẻ"
                        >
                            <Forward className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            className="flex items-center justify-center w-7 h-7 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-gray-700 rounded-full border border-gray-200 shadow-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95" 
                            title="Khác"
                        >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                    </div>

                </div>

                {/* Phần hiển thị Đã xem và Đã gửi */}
                {showSeenAvatar && (
                    <div className="flex items-center gap-0.5 mt-2">
                        {seenByUsers.slice(0, 5).map((user) => (
                            <img
                                key={user.userId}
                                src={user.avatarUrl || "/notfound.png"}
                                className="w-4 h-4 rounded-full object-cover border border-gray-200"
                                alt={user.userName}
                                title={`${user.userName} đã xem`}
                            />
                        ))}
                        {seenByUsers.length > 5 && (
                            <span className="text-[10px] text-gray-400 ml-0.5">
                                +{seenByUsers.length - 5}
                            </span>
                        )}
                    </div>
                )}
                {showSentStatus && (
                    <div className="flex items-center gap-1 mt-3 text-gray-400" title="Đã gửi">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Đã gửi</span>
                    </div>
                )}
            </div>
        </div>
    );
}
