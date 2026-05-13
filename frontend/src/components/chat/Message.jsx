import { CheckCircle2 } from "lucide-react";

export default function Message({ content, whoSend, time, avatar, targetAvatarUrl, showSeenAvatar, showSentStatus, previousMessageCreatedAt, currentMessageCreatedAt, nextMessageCreatedAt, currentSenderId, nextMessageSenderId }) {
    // Tính khoảng cách dựa trên thời gian
    const getMarginTop = () => {
        if (!previousMessageCreatedAt || !currentMessageCreatedAt) return 'mt-4'; // Default
        
        try {
            const currentTime = new Date(currentMessageCreatedAt.replace(" ", "T"));
            const prevTime = new Date(previousMessageCreatedAt.replace(" ", "T"));
            const diffMinutes = (currentTime - prevTime) / (1000 * 60); // Chuyển từ ms sang phút
            
            // Nếu cách nhau <= 1 phút: margin nhỏ (mt-1 = 4px)
            if (diffMinutes <= 1) {
                return 'mt-1';
            }
            // Nếu cách nhau > 1 phút: margin lớn (mt-6 = 24px)
            else {
                return 'mt-6';
            }
        } catch (error) {
            console.error('Time comparison error:', error);
            return 'mt-6'; // Default nếu có lỗi
        }
    };

    // Kiểm tra có nên hiển thị time không
    const shouldShowTime = () => {
        // Nếu không có message tiếp theo, hiển thị time (là message cuối)
        if (!nextMessageCreatedAt) return true;
        
        // Nếu người gửi tiếp theo khác → hiển thị time
        if (currentSenderId !== nextMessageSenderId) return true;
        
        // Nếu cùng người gửi, kiểm tra khoảng cách thời gian
        if (currentSenderId === nextMessageSenderId && nextMessageCreatedAt) {
            try {
                const currentTime = new Date(currentMessageCreatedAt.replace(" ", "T"));
                const nextTime = new Date(nextMessageCreatedAt.replace(" ", "T"));
                const diffMinutes = (nextTime - currentTime) / (1000 * 60);
                
                // Nếu cách > 1 phút: hiển thị time
                return diffMinutes > 1;
            } catch (error) {
                console.error('Time comparison error:', error);
                return true;
            }
        }
        
        return false;
    };

    return (
        <div className={`flex items-start gap-2 ${getMarginTop()} ${whoSend}`}>
            <img
                src={avatar || "/notfound.png"}
                className={`${whoSend === 'self-end' ? 'hidden' : ''} w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer`}
                alt=""
            />
            <div className={`flex flex-col ${whoSend === 'self-end' ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-1 rounded-lg shadow max-w-xl ${whoSend === 'self-end' ? 'bg-blue-100' : 'bg-white'}`}>
                    <p className="text-gray-800 wrap-break-word whitespace-pre-wrap">{content}</p>
                    {shouldShowTime() && <p className="text-xs text-gray-500 mt-1">{time}</p>}
                </div>
                {showSeenAvatar && (
                    <img 
                        src={targetAvatarUrl || avatar || "/notfound.png"} 
                        className="w-4 h-4 rounded-full mt-1 object-cover border border-gray-200" 
                        alt="Đã xem" 
                        title="Đã xem"
                    />
                )}
                {showSentStatus && (
                    <div className="flex items-center gap-1 mt-1 text-gray-400" title="Đã gửi">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Đã gửi</span>
                    </div>
                )}
            </div>
        </div>
    );
}
