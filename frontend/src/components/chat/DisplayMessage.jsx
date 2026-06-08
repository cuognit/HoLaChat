import React, { useEffect, useRef, useState, useCallback } from "react";
import Message from "./Message";
import { useChat } from "../../hooks/useChat";
import { useChatSocket } from "../../hooks/useChatSocket";
import { getMessagesByRoomFiltered, deleteMessageForMe } from "../../services/messageService";
import { normalizeIncomingMessage, parseApiDate } from "../../utils/chatMessage";
import { ArrowDown, Loader2, Loader } from "lucide-react";
import { DashRing, BouncingDots, Ripple} from "../LoadingUI";
import TypingIndicator from "./TypingIndicator";
import ConfirmDialog from "./dialog/ConfirmDialog";

export default function DisplayMessage({ onReply, onShare }) {
    const { selectedUser, setSelectedUser, currentUser } = useChat();
    const { subscribe, publish, isConnected } = useChatSocket();
    const containerRef = useRef(null);
    const observerTarget = useRef(null);
    const bottomObserverTarget = useRef(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const messages = Array.isArray(selectedUser?.messages) ? selectedUser.messages : [];
    const activeRoomId = selectedUser?.roomId;
    const currentUserId = currentUser?.id;
    const latestMessageIdRef = useRef(null);
    const isLoadingRef = useRef(false);
    const recallSubscriptionRef = useRef(null);
    const subscribedRecallRoomRef = useRef(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "danger",
        confirmText: "",
        onConfirm: null,
    });
    
    const scrollToBottom = () => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    };


    useEffect(() => {
        if (!messages || messages.length === 0) return;
        
        const lastMsg = messages.at(-1);
        const isNewMessageAtBottom = lastMsg.id !== latestMessageIdRef.current;
        
        if (isNewMessageAtBottom) {
            latestMessageIdRef.current = lastMsg.id;
            const isSentByMe = lastMsg.senderId === currentUserId;

            if (containerRef.current) {
                if (isSentByMe || page === 0 || !showScrollButton) {
                    setTimeout(() => {
                        if (containerRef.current) containerRef.current.scrollTop = 0;
                    }, 0);
                }
            }
        }
    }, [messages, currentUserId, page, showScrollButton]);

    useEffect(() => {
        setPage(0);
        setHasMore(true);
        setIsLoadingMessages(false);
    }, [activeRoomId]);

    // Subscribe to recall events via WebSocket
    useEffect(() => {
        if (!isConnected || !activeRoomId) return;
        if (subscribedRecallRoomRef.current === activeRoomId) return;

        recallSubscriptionRef.current?.unsubscribe();

        const sub = subscribe(`/topic/room/${activeRoomId}/recall`, (recalledMsg) => {
            if (!recalledMsg?.id) return;

            setSelectedUser(prev => {
                if (!prev || prev.roomId !== recalledMsg.roomId) return prev;
                const updatedMessages = (prev.messages || []).map(msg =>
                    msg.id === recalledMsg.id
                        ? { ...msg, recalled: true, content: "Tin nhắn đã được thu hồi", messageType: "TEXT" }
                        : msg
                );
                return { ...prev, messages: updatedMessages };
            });
        });

        if (sub) {
            recallSubscriptionRef.current = sub;
            subscribedRecallRoomRef.current = activeRoomId;
        }

        return () => {
            recallSubscriptionRef.current?.unsubscribe();
            recallSubscriptionRef.current = null;
            subscribedRecallRoomRef.current = null;
        };
    }, [activeRoomId, isConnected, subscribe, setSelectedUser]);

    useEffect(() => {
        if (!selectedUser || !activeRoomId || !currentUserId) {
            return;
        }

        let isMounted = true;

        async function loadMessages() {
            const fetchId = `${activeRoomId}-${page}`;
            if (isLoadingRef.current === fetchId) return;
            isLoadingRef.current = fetchId;

            if (page === 0) {
                setIsLoadingMessages(true);
            } else {
                setIsFetchingMore(true);
            }

            try {               
                const response = await getMessagesByRoomFiltered(activeRoomId, currentUserId, page, 20);
                if (!isMounted) {
                    return;
                }
                const roomMessages = response.messages || [];
                setHasMore(response.hasMore || false);

                const normalizedMessages = roomMessages.map((message) =>
                    normalizeIncomingMessage(message, currentUserId)
                );
                setSelectedUser((prevUser) => {
                    if (!prevUser || prevUser.roomId !== activeRoomId) {
                        return prevUser;
                    }
                    const existingMessages = Array.isArray(prevUser.messages) ? prevUser.messages : [];
                    let newMessages;
                    if (page === 0) {
                        newMessages = normalizedMessages;
                    } else {
                        const existingIds = new Set(existingMessages.map(m => m.id));
                        const uniqueOlderMessages = normalizedMessages.filter(m => !existingIds.has(m.id));
                        newMessages = [...uniqueOlderMessages, ...existingMessages];
                    }
                    return {
                        ...prevUser,
                        messages: newMessages,
                    };
                });
            } catch (error) {
                console.error("Khong the lay lich su tin nhan:", error);
            } finally {
                if (isLoadingRef.current === fetchId) {
                    isLoadingRef.current = null;
                }
                if (isMounted) {
                    setIsLoadingMessages(false);
                    setIsFetchingMore(false);
                }
            }
        }
        loadMessages();
        return () => {
            isMounted = false;
        };
    }, [selectedUser?.id, activeRoomId, currentUserId, setSelectedUser, page]);

    const handleObserver = useCallback((entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingRef.current) {
            setPage((prev) => prev + 1);
        }
    }, [hasMore, page]);

    useEffect(() => {
        const option = {
            root: containerRef.current,
            rootMargin: "100px",
            threshold: 0
        };
        const observer = new IntersectionObserver(handleObserver, option);
        const currentTarget = observerTarget.current;
        
        if (currentTarget) observer.observe(currentTarget);
        
        return () => {
            if (currentTarget) observer.unobserve(currentTarget);
        };
    }, [handleObserver, messages.length]);

    const handleBottomObserver = useCallback((entries) => {
        const target = entries[0];
        setShowScrollButton(!target.isIntersecting);
    }, []);

    useEffect(() => {
        const option = {
            root: containerRef.current,
            rootMargin: "0px",
            threshold: 0
        };
        const observer = new IntersectionObserver(handleBottomObserver, option);
        const currentTarget = bottomObserverTarget.current;
        
        if (currentTarget) observer.observe(currentTarget);
        
        return () => {
            if (currentTarget) observer.unobserve(currentTarget);
        };
    }, [handleBottomObserver, activeRoomId]);

    const formatDateDivider = (dateString) => {
        if (!dateString) return "";
        try {
            const date = parseApiDate(dateString);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return "Hôm nay";
            } else if (date.toDateString() === yesterday.toDateString()) {
                return "Hôm qua";
            } else {
                return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
        } catch (e) {
             console.log(e);
            return dateString;
        }
    };

    const renderDateDivider = (dateString) => (
        <div className="w-full flex justify-center my-4">
            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                {dateString}
            </span>
        </div>
    );

    const handleDeleteForMe = useCallback((message) => {
        setConfirmDialog({
            isOpen: true,
            title: "Xóa tin nhắn phía tôi",
            message: "Tin nhắn sẽ bị xóa khỏi giao diện của bạn nhưng vẫn hiển thị ở phía người khác. Bạn chắc chắn?",
            type: "danger",
            confirmText: "Xóa",
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    await deleteMessageForMe(message.id, currentUserId);
                    setSelectedUser(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            messages: (prev.messages || []).filter(m => m.id !== message.id),
                        };
                    });
                } catch (error) {
                    console.error("Xóa tin nhắn thất bại:", error);
                }
            },
        });
    }, [currentUserId, setSelectedUser]);

    const handleRecall = useCallback((message) => {
        setConfirmDialog({
            isOpen: true,
            title: "Thu hồi tin nhắn",
            message: "Tin nhắn sẽ bị thu hồi khỏi tất cả mọi người trong cuộc trò chuyện. Bạn chắc chắn?",
            type: "warning",
            confirmText: "Thu hồi",
            onConfirm: () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                try {
                    publish("/app/message/recall", {
                        messageId: message.id,
                        userId: currentUserId,
                    });
                    setSelectedUser(prev => {
                        if (!prev) return prev;
                        const updatedMessages = (prev.messages || []).map(m =>
                            m.id === message.id
                                ? { ...m, recalled: true, content: "Tin nhắn đã được thu hồi", messageType: "TEXT" }
                                : m
                        );
                        return { ...prev, messages: updatedMessages };
                    });
                } catch (error) {
                    console.error("Thu hồi tin nhắn thất bại:", error);
                }
            },
        });
    }, [currentUserId, publish, setSelectedUser]);

    if (!selectedUser) {
        return null;
    }

    return (
        <div className="relative flex-1 flex flex-col overflow-hidden">
            <div ref={containerRef} className="bg-gray-100 flex-1 px-4 overflow-y-auto flex flex-col-reverse relative">
                <TypingIndicator />
                <div ref={bottomObserverTarget} className="h-6 w-full shrink-0"></div>

                {isLoadingMessages ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 m-auto"> 
                        <Ripple className="h-15 w-15 text-blue-400" />
                    </div>
                ) : messages.length > 0 ? (() => {
                    const reversedMessages = [...messages].reverse().filter(
                        msg => !(msg.messageType === "SYSTEM" && msg.content && msg.content.includes("đã bày tỏ cảm xúc"))
                    );
                    return reversedMessages.map((message, index) => {
                        const previousMessage = reversedMessages[index + 1];
                        const nextMessage = reversedMessages[index - 1];
                        const previousMessageCreatedAt = previousMessage?.createdAt ?? null;
                        const currentMessageCreatedAt = message?.createdAt ?? null;
                        const nextMessageCreatedAt = nextMessage?.createdAt ?? null;
                        const currentSenderId = message?.senderId ?? null;
                        const nextMessageSenderId = nextMessage?.senderId ?? null;
                        const previousSenderId = previousMessage?.senderId ?? null;

                        const isLastMessage = index === 0;
                        const isSentByMe = message.whoSend === "self-end";

                        const seenByUsers = isLastMessage && isSentByMe
                            ? (selectedUser.seenByUsers ?? []).filter(
                                u => String(u.userId) !== String(currentUserId)
                              )
                            : [];

                        const showSeenAvatar = seenByUsers.length > 0;
                        const showSentStatus = isLastMessage && isSentByMe && !showSeenAvatar;
                        
                        const currentDateString = message?.createdAt ? parseApiDate(message.createdAt)?.toDateString() : null;
                        const previousDateString = previousMessageCreatedAt ? parseApiDate(previousMessageCreatedAt)?.toDateString() : null;
                        const showDateDivider = currentDateString && currentDateString !== previousDateString;

                        return (
                            <React.Fragment key={message.id ?? index}>
                                <Message
                                    content={message.content ?? ""}
                                    whoSend={message.whoSend ?? "self-start"}
                                    time={message.time ?? ""}
                                    avatar={selectedUser.isGroup ? message.senderAvatarUrl : (selectedUser.targetAvatarUrl || selectedUser.avatarUrl)}
                                    targetAvatarUrl={selectedUser.targetAvatarUrl || selectedUser.avatarUrl}
                                    showSeenAvatar={showSeenAvatar}
                                    showSentStatus={showSentStatus}
                                    seenByUsers={seenByUsers}
                                    previousMessageCreatedAt={previousMessageCreatedAt}
                                    currentMessageCreatedAt={currentMessageCreatedAt}
                                    nextMessageCreatedAt={nextMessageCreatedAt}
                                    currentSenderId={currentSenderId}
                                    nextMessageSenderId={nextMessageSenderId}
                                    previousSenderId={previousSenderId}
                                    messageType={message.messageType}
                                    senderName={message.senderName}
                                    isGroup={selectedUser.isGroup}
                                    recalled={message.recalled}
                                    messageId={message.id}
                                    messageData={message}
                                    onDeleteForMe={() => handleDeleteForMe(message)}
                                    onRecall={() => handleRecall(message)}
                                    onReplyClick={() => onReply && onReply(message)}
                                    onShareClick={() => onShare && onShare(message)}
                                />
                                {showDateDivider && renderDateDivider(formatDateDivider(message.createdAt))}
                            </React.Fragment>
                        );
                    });
                })() : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-sm text-gray-500">Bắt đầu trò chuyện</p>
                    </div>
                )}
                
                <div ref={observerTarget} className="h-4 w-full"></div>
                {!isLoadingMessages && isFetchingMore && (
                    <div className="w-full flex justify-center my-2">
                        <DashRing className="w-4 h-4 text-blue-500" />
                    </div>
                )}
            </div>

            {showScrollButton && (
                <button 
                    onClick={scrollToBottom}
                    className="cursor-pointer absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 text-blue-600 p-2 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 z-50 transition-all flex items-center justify-center opacity-80 hover:opacity-100"
                    title="Cuộn xuống dưới cùng"
                >
                    <ArrowDown className="w-5 h-5" />
                </button>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText={confirmDialog.confirmText}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
