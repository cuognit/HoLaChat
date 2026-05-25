import React, { useEffect, useRef, useState, useCallback } from "react";
import Message from "./Message";
import { useChat } from "../../hooks/useChat";
import { getMessagesByRoom } from "../../services/messageService";
import { normalizeIncomingMessage } from "../../utils/chatMessage";
import { ArrowDown, Loader2, Loader } from "lucide-react";
import { DashRing, BouncingDots, Ripple} from "../LoadingUI";
export default function DisplayMessage() {
    const { selectedUser, setSelectedUser, currentUser } = useChat();
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
    
    const scrollToBottom = () => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
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
                // Auto scroll down if I just sent a message, OR if I'm at page 0 (initial load), OR if I was already at the bottom
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
                const roomMessages = await getMessagesByRoom(activeRoomId, page, 20);
                if (!isMounted) {
                    return;
                }
                if (roomMessages.length < 20) {
                    setHasMore(false);
                }
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
                        // Remove duplicates when prepending older messages
                        const existingIds = new Set(existingMessages.map(m => m.id));
                        const uniqueOlderMessages = normalizedMessages.filter(m => !existingIds.has(m.id));
                        newMessages = [...uniqueOlderMessages, ...existingMessages];
                    }
                    return {
                        ...prevUser,
                        messages: newMessages,
                        lastMessage: newMessages.at(-1)?.content ?? prevUser.lastMessage,
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
            rootMargin: "100px", // Trigger slightly earlier
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
        // If bottom is NOT intersecting, it means we are scrolled up
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
            const date = new Date(dateString.replace(" ", "T"));
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

    if (!selectedUser) {
        return null;
    }

    return (
        <div className="relative flex-1 flex flex-col overflow-hidden">
            <div ref={containerRef} className="bg-gray-100 flex-1 px-4 overflow-y-auto flex flex-col-reverse relative">
                {/* Cảm biến vị trí dưới cùng */}
                <div ref={bottomObserverTarget} className="h-1 w-full shrink-0"></div>

                {isLoadingMessages ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 m-auto"> 
                        <Ripple className="h-15 w-15 text-blue-400" />
                        <p className="text-center text-gray-500 mb-2 text-[14px]">
                            Nếu chờ quá lâu, vui lòng tải lại trang
                        </p>
                    </div>
                    // <div className="w-8 h-8 border-3 border-blue-400/30 border-t-blue-500 rounded-full animate-spin m-auto"></div>
                ) : messages.length > 0 ? (() => {
                    const reversedMessages = [...messages].reverse();
                    return reversedMessages.map((message, index) => {
                        const previousMessage = reversedMessages[index + 1];
                        const nextMessage = reversedMessages[index - 1];
                        const previousMessageCreatedAt = previousMessage?.createdAt ?? null;
                        const currentMessageCreatedAt = message?.createdAt ?? null;
                        const nextMessageCreatedAt = nextMessage?.createdAt ?? null;
                        const currentSenderId = message?.senderId ?? null;
                        const nextMessageSenderId = nextMessage?.senderId ?? null;

                        const isLastMessage = index === 0; // Because we are iterating the reversed array
                        const isSentByMe = message.whoSend === "self-end";
                        const showSeenAvatar = isLastMessage && isSentByMe && selectedUser.isLastMessageSeen;
                        const showSentStatus = isLastMessage && isSentByMe && !selectedUser.isLastMessageSeen;
                        
                        const currentDateString = message?.createdAt ? new Date(message.createdAt.replace(" ", "T")).toDateString() : null;
                        const previousDateString = previousMessageCreatedAt ? new Date(previousMessageCreatedAt.replace(" ", "T")).toDateString() : null;
                        const showDateDivider = currentDateString && currentDateString !== previousDateString;

                        return (
                            <React.Fragment key={message.id ?? index}>
                                <Message
                                    content={message.content ?? ""}
                                    whoSend={message.whoSend ?? "self-start"}
                                    time={message.time ?? ""}
                                    avatar={selectedUser.targetAvatarUrl || selectedUser.avatarUrl}
                                    targetAvatarUrl={selectedUser.targetAvatarUrl || selectedUser.avatarUrl}
                                    showSeenAvatar={showSeenAvatar}
                                    showSentStatus={showSentStatus}
                                    previousMessageCreatedAt={previousMessageCreatedAt}
                                    currentMessageCreatedAt={currentMessageCreatedAt}
                                    nextMessageCreatedAt={nextMessageCreatedAt}
                                    currentSenderId={currentSenderId}
                                    nextMessageSenderId={nextMessageSenderId}
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
                
                {/* Invisible element to trigger intersection observer for infinite scroll */}
                <div ref={observerTarget} className="h-4 w-full"></div>
                {!isLoadingMessages && isFetchingMore && (
                    <div className="w-full flex justify-center my-2">
                        <DashRing className="w-4 h-4 text-blue-500" />
                    </div>
                )}
            </div>

            {/* Nút cuộn xuống dưới cùng */}
            {showScrollButton && (
                <button 
                    onClick={scrollToBottom}
                    className="cursor-pointer absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 text-blue-600 p-2 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 z-50 transition-all flex items-center justify-center opacity-80 hover:opacity-100"
                    title="Cuộn xuống dưới cùng"
                >
                    <ArrowDown className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
