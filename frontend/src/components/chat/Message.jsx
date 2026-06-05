import { useState, useRef, useCallback } from "react";
import { CheckCircle2, ThumbsUp, Quote, Forward, MoreHorizontal, RotateCcw } from "lucide-react";
import ImageGrid from "./ImageGrid";
import MessageActionMenu from "./MessageActionMenu";
import MessageDetailPopup from "./MessageDetailPopup";

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
    isGroup,
    recalled,
    messageId,
    messageData,
    onDeleteForMe,
    onRecall,
    onReplyClick,
    onShareClick,
}) {
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const moreButtonRef = useRef(null);
    
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

    const isLastInConsecutiveGroup = () => {
        if (!nextMessageCreatedAt || !nextMessageSenderId) return true;
        if (String(nextMessageSenderId) !== String(currentSenderId)) return true;
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

    const isConsecutive = () => {
        if (!previousMessageCreatedAt || !currentMessageCreatedAt || !previousSenderId || !currentSenderId) return false;
        if (String(previousSenderId) !== String(currentSenderId)) return false;
        try {
            const currentTime = safeParseDate(currentMessageCreatedAt);
            const prevTime = safeParseDate(previousMessageCreatedAt);
            if (!currentTime || !prevTime) return false;
            const diffMinutes = Math.abs(currentTime.getTime() - prevTime.getTime()) / (1000 * 60);
            return diffMinutes <= 1;
        } catch (error) {
            console.error('Consecutive comparison error:', error);
            return false;
        }
    };

    const getMarginTop = () => {
        if (!previousMessageCreatedAt || !currentMessageCreatedAt || !previousSenderId || !currentSenderId) return 'mt-4';
        if (String(previousSenderId) !== String(currentSenderId)) {
            return 'mt-6';
        }
        try {
            const currentTime = safeParseDate(currentMessageCreatedAt);
            const prevTime = safeParseDate(previousMessageCreatedAt);
            if (!currentTime || !prevTime) return 'mt-6';
            const diffMinutes = Math.abs(currentTime.getTime() - prevTime.getTime()) / (1000 * 60);
            if (diffMinutes <= 1) {
                return 'mt-1';
            } else {
                return 'mt-6';
            }
        } catch (error) {
            console.error('Time comparison error:', error);
            return 'mt-6';
        }
    };

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
    const shouldShowSenderName = isGroup && !isSentByMe && senderName && !isConsecutive();
    const isRecalled = recalled === true;

    const handleCopySuccess = useCallback(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 1500);
    }, []);

    return (
        <>
            <div id={`msg-${messageId}`} className={`flex items-start gap-2 w-full ${getMarginTop()} ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                {!isSentByMe && (
                    isConsecutive() ? (
                        <div className="w-10 h-10 shrink-0" />
                    ) : (
                        <img
                            src={avatar || "/avatar.jpg"}
                            className="w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer shrink-0"
                            alt=""
                        />
                    )
                )}

                <div className={`flex flex-col flex-1 max-w-[85%] ${isSentByMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 group/msg relative ${isSentByMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        <div className={`relative ${isRecalled ? 'px-4 py-2' : messageType === 'IMAGE' ? 'p-1' : 'px-4 py-2'} rounded-2xl shadow-sm border max-w-lg transition-all duration-150 ${
                            isRecalled
                                ? 'bg-gray-50 border-gray-200/50 border-dashed'
                                : isSentByMe 
                                    ? 'bg-blue-50 text-blue-950 border-blue-200/50 hover:bg-blue-100/60' 
                                    : 'bg-white text-gray-800 border-gray-100 hover:bg-gray-50/70'
                        }`}>
                            {messageData?.forwarded && !isRecalled && (
                                <div className={`flex items-center gap-1 mb-1 opacity-70 ${messageType === 'IMAGE' ? 'px-3 pt-1' : ''}`}>
                                    <Forward className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-medium italic">Đã chuyển tiếp</span>
                                </div>
                            )}

                            {shouldShowSenderName && !isRecalled && (
                                <p className={`text-[11px] font-semibold text-orange-600 mb-0.5 select-none ${messageType === 'IMAGE' && !messageData?.forwarded ? 'px-3 pt-1' : ''}`}>{senderName}</p>
                            )}

                            {!isRecalled && messageData?.replyToId && (
                                <div 
                                    className="flex items-start bg-black/5 rounded px-2 py-1.5 mb-1.5 border-l-[3px] border-blue-500 cursor-pointer hover:bg-black/10 transition-colors"
                                    onClick={() => {
                                        const el = document.getElementById(`msg-${messageData.replyToId}`);
                                        if (el) {
                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            el.classList.add('bg-blue-100/50', 'transition-colors', 'duration-500');
                                            setTimeout(() => el.classList.remove('bg-blue-100/50'), 5000);
                                        }
                                    }}
                                >
                                    <div className="flex-1 min-w-0 flex flex-col pr-2">
                                        <span className="text-[11px] font-semibold text-blue-600">{messageData.replyToSenderName || "Người dùng"}</span>
                                        {messageData.replyToMessageType === 'IMAGE' ? (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {(() => {
                                                    let imgUrl = "";
                                                    try {
                                                        const urls = JSON.parse(messageData.replyToContent);
                                                        imgUrl = Array.isArray(urls) ? urls[0] : messageData.replyToContent;
                                                    } catch {
                                                        imgUrl = messageData.replyToContent;
                                                    }
                                                    return (
                                                        <img src={imgUrl} alt="Reply Thumbnail" className="w-6 h-6 object-cover rounded-[3px] border border-gray-200" />
                                                    );
                                                })()}
                                                <span className="text-[12px] text-gray-500 italic truncate">[Hình ảnh]</span>
                                            </div>
                                        ) : (
                                            <p className="text-[12px] text-gray-600 truncate opacity-90">{messageData.replyToContent}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isRecalled ? (
                                <div className="flex items-center gap-2 select-none">
                                    <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
                                    <p className="text-[13.5px] text-gray-400 italic">Tin nhắn đã được thu hồi</p>
                                </div>
                            ) : messageType === 'IMAGE' ? (() => {
                                let imageUrls = [];
                                try {
                                    imageUrls = JSON.parse(content);
                                } catch {
                                    imageUrls = [content];
                                }
                                return <ImageGrid images={imageUrls} />;
                            })() : (
                                <p className="wrap-break-word whitespace-pre-wrap leading-relaxed text-[14.5px]">{content}</p>
                            )}
                            
                            {shouldShowTime() && (
                                <p className={`text-[10px] text-gray-400 mt-2 select-none ${!isRecalled && messageType === 'IMAGE' ? 'px-3 pb-1' : ''} ${isSentByMe ? 'text-right' : 'text-left'}`}>
                                    {time}
                                </p>
                            )}

                            {!isRecalled && isLastInConsecutiveGroup() && (
                                <div className={`absolute -bottom-3 ${isSentByMe ? 'left-0' : 'right-0'} z-20 group/like`}>
                                    <button className="flex items-center justify-center w-5 h-5 bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-500 rounded-full border border-gray-200 shadow-sm transition-all duration-150 cursor-pointer active:scale-90">
                                        <ThumbsUp className="w-3 h-3 stroke-[2.5]" />
                                    </button>
                                    
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

                        {!isRecalled && (
                            <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/msg:pointer-events-auto">
                                <button 
                                    onClick={onReplyClick}
                                    className="flex items-center justify-center w-6 h-6 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-blue-500 rounded-full border border-gray-200 shadow-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95" 
                                    title="Trả lời"
                                >
                                    <Quote className="w-2.5 h-2.5 fill-current rotate-180" />
                                </button>
                                <button 
                                    onClick={onShareClick}
                                    className="flex items-center justify-center w-6 h-6 bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-blue-500 rounded-full border border-gray-200 shadow-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95" 
                                    title="Chia sẻ"
                                >
                                    <Forward className="w-4 h-4" />
                                </button>
                                <button 
                                    ref={moreButtonRef}
                                    onClick={() => setShowActionMenu(true)}
                                    className={`flex items-center justify-center w-6 h-6 ${showActionMenu ? 'bg-blue-100 text-blue-600 border-blue-300' : 'bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-blue-500 border-gray-200'} rounded-full border shadow-sm transition-all duration-150 cursor-pointer hover:scale-105 active:scale-95`} 
                                    title="Khác"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                    </div>

                    {copySuccess && (
                        <div className={`text-[11px] text-green-600 font-medium mt-1 animate-in fade-in duration-200 ${isSentByMe ? 'text-right' : 'text-left'}`}>
                            ✓ Đã sao chép
                        </div>
                    )}

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

            <MessageActionMenu
                isOpen={showActionMenu}
                onClose={() => setShowActionMenu(false)}
                anchorRef={moreButtonRef}
                isSentByMe={isSentByMe}
                messageContent={content}
                messageType={messageType}
                onCopy={handleCopySuccess}
                onDetail={() => setShowDetail(true)}
                onDeleteForMe={onDeleteForMe}
                onRecall={onRecall}
                onReply={onReplyClick}
                onShare={onShareClick}
            />

            <MessageDetailPopup
                isOpen={showDetail}
                onClose={() => setShowDetail(false)}
                message={messageData}
            />
        </>
    );
}
