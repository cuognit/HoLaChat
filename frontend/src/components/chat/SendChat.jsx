import { useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { SendHorizonal, Smile, ThumbsUp } from 'lucide-react';
import { useChat } from "../../hooks/useChat";
import { useChatSocket } from "../../hooks/useChatSocket";
import { normalizeIncomingMessage } from "../../utils/chatMessage";
import EmojiPicker from "emoji-picker-react";
export default function SendChat() {
    const { selectedUser, setSelectedUser, currentUser } = useChat();
    const { isConnected, publish, subscribe } = useChatSocket();
    const currentUserId = currentUser?.id;
    const targetUserId = selectedUser?.targetUserId ;
    const activeRoomId = selectedUser?.roomId ?? null;
    const [inputMessage, setInputMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const roomSubscriptionRef = useRef(null);
    const seenSubscriptionRef = useRef(null);
    const queueSubscriptionRef = useRef(null);
    const subscribedRoomIdRef = useRef(null);
    const selectedUserRef = useRef(selectedUser);
    const currentUserIdRef = useRef(currentUserId);

    const canSendMessage = useMemo(() => {
        return Boolean(selectedUser && currentUserId && inputMessage.trim());
    }, [selectedUser, currentUserId, inputMessage]);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
        currentUserIdRef.current = currentUserId;
    }, [selectedUser, currentUserId]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const onEmojiClick = (emojiObject) => {
        setInputMessage((prevInput) => prevInput + emojiObject.emoji);
    };

    function appendLocalMessage(content) {
        setSelectedUser((prevUser) => {
            if (!prevUser) {
                return prevUser;
            }

            const currentMessages = Array.isArray(prevUser.messages) ? prevUser.messages : [];
            const now = new Date();
            const localMessage = {
                id: `local-${Date.now()}`,
                roomId: prevUser.roomId ?? null,
                content,
                whoSend: "self-end",
                time: now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                createdAt: now.toISOString(),
                senderId: currentUserIdRef.current,
            };

            return {
                ...prevUser,
                lastMessage: content,
                lastMessageTime: now.toISOString(),
                lastMessageSenderId: currentUserIdRef.current,
                isLastMessageSeen: false, // New message is not seen initially
                messages: [...currentMessages, localMessage],
            };
        });
    }

    function appendMessageToSelectedUser(socketMessage, nextRoomId = socketMessage.roomId) {
        const normalizedMessage = normalizeIncomingMessage(socketMessage, currentUserIdRef.current);

        setSelectedUser((prevUser) => {
            if (!prevUser) {
                return prevUser;
            }

            const currentMessages = Array.isArray(prevUser.messages) ? prevUser.messages : [];
            const alreadyExists = currentMessages.some((message) => message.id === normalizedMessage.id);

            if (alreadyExists) {
                return {
                    ...prevUser,
                    roomId: prevUser.roomId ?? nextRoomId,
                };
            }

            const isSentByMe = normalizedMessage.senderId === currentUserIdRef.current;
            const isSeen = isSentByMe ? false : true;

            return {
                ...prevUser,
                roomId: prevUser.roomId ?? nextRoomId,
                lastMessage: normalizedMessage.content,
                lastMessageTime: normalizedMessage.createdAt,
                lastMessageSenderId: normalizedMessage.senderId,
                isLastMessageSeen: isSeen,
                messages: [...currentMessages, normalizedMessage],
            };
        });
    }

    function subscribeToRoom(roomId) {
        if (!roomId || subscribedRoomIdRef.current === roomId) {
            return;
        }

        roomSubscriptionRef.current?.unsubscribe();
        seenSubscriptionRef.current?.unsubscribe();

        const nextSubscription = subscribe(`/topic/room/${roomId}`, (roomMessage) => {
            if (!roomMessage?.roomId || roomMessage.roomId !== roomId) {
                return;
            }
            
            appendMessageToSelectedUser(roomMessage, roomId);

        });

        const nextSeenSubscription = subscribe(`/topic/room/${roomId}/seen`, (actionReq) => {
            // If the opponent entered the room, they've seen the messages
            if (actionReq?.userId && actionReq.userId !== currentUserIdRef.current) {
                setSelectedUser(prev => prev ? { ...prev, isLastMessageSeen: true } : prev);
            }
        });

        if (nextSubscription) {
            roomSubscriptionRef.current = nextSubscription;
            subscribedRoomIdRef.current = roomId;
        }
        
        if (nextSeenSubscription) {
            seenSubscriptionRef.current = nextSeenSubscription;
        }

    }

    useEffect(() => {
        if (!isConnected || queueSubscriptionRef.current) {
            return;
        }

        const subscription = subscribe("/user/queue/chat", (message) => {
            if (!message?.roomId) {
                return;
            }

            if (selectedUserRef.current && message.senderId === currentUserIdRef.current) {
                appendMessageToSelectedUser(message, message.roomId);
            }

            subscribeToRoom(message.roomId);
        });

        if (subscription) {
            queueSubscriptionRef.current = subscription;
        }

        return () => {
            queueSubscriptionRef.current?.unsubscribe();
            queueSubscriptionRef.current = null;
        };
    }, [isConnected, subscribe]);

    useEffect(() => {
        if (!isConnected || !activeRoomId) {
            return;
        }

        subscribeToRoom(activeRoomId);

        return () => {
            roomSubscriptionRef.current?.unsubscribe();
            seenSubscriptionRef.current?.unsubscribe();
            roomSubscriptionRef.current = null;
            seenSubscriptionRef.current = null;
            subscribedRoomIdRef.current = null;
        };
    }, [activeRoomId, isConnected, subscribe]);

    function handleSubmit(event, isThumbsUp = false) {
        if (event) event.preventDefault();
        
        let messageToSend = inputMessage.trim();
        if (isThumbsUp) {
            messageToSend = "👍";
        }
        if (!selectedUser || !currentUserId || !messageToSend || (!targetUserId && !activeRoomId)) {
            return;
        }

        const payload = {
            senderId: currentUserId,
            content: messageToSend,
        };

        if (targetUserId) {
            payload.receiverId = targetUserId;
        }

        if (activeRoomId) {
            payload.roomId = activeRoomId;
        }

        if (!isConnected) {
            appendLocalMessage(messageToSend);
            if (!isThumbsUp) setInputMessage("");
            console.warn("Socket dang offline, tin nhan moi chi duoc hien thi tam tren FE.");
            return;
        }

        try {
            publish("/app/chat", payload);
            if (!isThumbsUp) setInputMessage("");
           

        } catch (error) {
            console.error("Khong the gui tin nhan qua socket:", error);
            appendLocalMessage(messageToSend);
            if (!isThumbsUp) setInputMessage("");
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            handleSubmit(event);
        }
    }

    return (
        <div className="bg-white mb-1 border-t border-gray-200 px-4 w-full">
            <form className="flex gap-2 items-end w-full relative" onSubmit={handleSubmit}>
                <TextareaAutosize
                    value={inputMessage}
                    onChange={(event) => setInputMessage(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedUser ? "Nhap tin nhan..." : "Hay chon mot cuoc tro chuyen"}
                    className="flex-1 py-3 outline-none resize-none w-full disabled:bg-white disabled:text-gray-400"
                    maxRows={7}
                    minRows={1}
                    disabled={!selectedUser}
                />
                
                <div className="relative mb-1" ref={emojiPickerRef}>
                    <button 
                        type="button" 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        disabled={!selectedUser}
                        className="disabled:cursor-not-allowed"
                    >
                        <Smile className={selectedUser ? "text-gray-400 hover:text-blue-600 cursor-pointer" : "text-gray-300"} />
                    </button>

                    {showEmojiPicker && (
                        <div className="absolute bottom-10 right-0 z-50 shadow-lg rounded-lg">
                            <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                    )}
                </div>
                {canSendMessage ? (
                    <button
                        type="submit"
                        className="mb-2.5"
                    >
                        <SendHorizonal className="text-gray-400 hover:text-blue-600 cursor-pointer" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        className="mb-3 disabled:cursor-not-allowed"
                        disabled={!selectedUser}
                    >
                        <ThumbsUp className={selectedUser ? "text-blue-500 hover:text-blue-600 cursor-pointer" : "text-gray-300"} />
                    </button>
                )}
            </form>
        </div>
    );
}
