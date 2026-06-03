import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { SendHorizonal, Smile, ThumbsUp, ImagePlus, X, Loader2 } from 'lucide-react';
import { useChat } from "../../hooks/useChat";
import { useChatSocket } from "../../hooks/useChatSocket";
import { normalizeIncomingMessage } from "../../utils/chatMessage";
import { compressImage } from "../../utils/imageCompressor";
import { uploadImages } from "../../services/messageService";
import EmojiPicker from "emoji-picker-react";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB (nén trước khi upload)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

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
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    // Image upload state
    const [pendingImages, setPendingImages] = useState([]); // { id, file, previewUrl }
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const abortControllerRef = useRef(null);
    const dropZoneRef = useRef(null);

    const canSendMessage = useMemo(() => {
        return Boolean(selectedUser && currentUserId && (inputMessage.trim() || pendingImages.length > 0));
    }, [selectedUser, currentUserId, inputMessage, pendingImages]);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
        currentUserIdRef.current = currentUserId;
    }, [selectedUser, currentUserId]);

    // Cleanup preview URLs on unmount or when images change
    useEffect(() => {
        return () => {
            pendingImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        };
    }, []);

    // Clear pending images when switching conversations
    useEffect(() => {
        setPendingImages(prev => {
            prev.forEach(img => URL.revokeObjectURL(img.previewUrl));
            return [];
        });
        setIsUploading(false);
        setUploadProgress(0);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, [selectedUser?.id, selectedUser?.roomId]);

    const emitTyping = useCallback(() => {
        if (!isConnected || !activeRoomId || !currentUserId) return;

        // Chỉ gửi event typing nếu chưa gửi hoặc đã hết debounce
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            publish("/app/typing", {
                roomId: activeRoomId,
                userId: currentUserId,
                userName: currentUser?.userName,
                avatarUrl: currentUser?.avatarUrl,
                typing: true,
            });
        }

        // Reset timeout: sau 3s không gõ → gửi stop typing
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            publish("/app/typing", {
                roomId: activeRoomId,
                userId: currentUserId,
                userName: currentUser?.userName,
                avatarUrl: currentUser?.avatarUrl,
                typing: false,
            });
        }, 3000);
    }, [isConnected, activeRoomId, currentUserId, currentUser?.userName, currentUser?.avatarUrl, publish]);

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

    // ==================== Image Handling ====================

    function validateAndAddFiles(fileList) {
        const files = Array.from(fileList);
        const validFiles = [];

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                console.warn(`File "${file.name}" không phải ảnh hợp lệ`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                console.warn(`File "${file.name}" vượt quá 20MB`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        setPendingImages(prev => {
            const remaining = MAX_IMAGES - prev.length;
            const toAdd = validFiles.slice(0, remaining);
            const newImages = toAdd.map(file => ({
                id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                file,
                previewUrl: URL.createObjectURL(file),
            }));
            return [...prev, ...newImages];
        });
    }

    function removeImage(imageId) {
        setPendingImages(prev => {
            const img = prev.find(i => i.id === imageId);
            if (img) URL.revokeObjectURL(img.previewUrl);
            return prev.filter(i => i.id !== imageId);
        });
    }

    function cancelUpload() {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsUploading(false);
        setUploadProgress(0);
    }

    // File input change handler
    function handleFileSelect(e) {
        if (e.target.files) {
            validateAndAddFiles(e.target.files);
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    }

    // Paste handler
    useEffect(() => {
        function handlePaste(e) {
            if (!selectedUser) return;
            const items = e.clipboardData?.items;
            if (!items) return;

            const imageFiles = [];
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) imageFiles.push(file);
                }
            }

            if (imageFiles.length > 0) {
                e.preventDefault();
                validateAndAddFiles(imageFiles);
            }
        }

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [selectedUser]);

    // Drag and drop handlers
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedUser) return;
        setIsDragOver(true);
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only set false if leaving the drop zone entirely
        if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (!selectedUser) return;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            validateAndAddFiles(files);
        }
    }

    // ==================== Message Handling ====================

    function appendLocalMessage(content, messageType = "TEXT") {
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
                messageType,
            };

            return {
                ...prevUser,
                lastMessage: messageType === "IMAGE" ? "📷 Hình ảnh" : content,
                lastMessageTime: now.toISOString(),
                lastMessageSenderId: currentUserIdRef.current,
                isLastMessageSeen: false,
                seenByUsers: [], // Reset khi gửi tin mới
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
            
            // Nếu đã có tin nhắn với id thật này → bỏ qua
            const alreadyExists = currentMessages.some((message) => message.id === normalizedMessage.id);
            if (alreadyExists) {
                return {
                    ...prevUser,
                    roomId: prevUser.roomId ?? nextRoomId,
                };
            }

            // Nếu tồn tại tin nhắn local tạm do chính mình gửi với cùng nội dung → thay thế nó
            const localIndex = currentMessages.findLastIndex(
                (msg) =>
                    typeof msg.id === 'string' &&
                    msg.id.startsWith('local-') &&
                    msg.senderId === normalizedMessage.senderId &&
                    msg.content === normalizedMessage.content
            );


            let nextMessages;
            if (localIndex !== -1) {
                // Thay thế local message bằng tin thật từ server
                nextMessages = [...currentMessages];
                nextMessages[localIndex] = normalizedMessage;
            } else {
                nextMessages = [...currentMessages, normalizedMessage];
            }

            return {
                ...prevUser,
                roomId: prevUser.roomId ?? nextRoomId,
                lastMessage: normalizedMessage.messageType === "IMAGE" ? "📷 Hình ảnh" : normalizedMessage.content,
                lastMessageTime: normalizedMessage.createdAt,
                lastMessageSenderId: normalizedMessage.senderId,
                isLastMessageSeen: false,
                seenByUsers: [],
                messages: nextMessages,
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
            // actionReq: { roomId, seenByUsers: [{userId, userName, avatarUrl}] }
            setSelectedUser(prev => {
                if (!prev) return prev;
                const seenList = actionReq?.seenByUsers ?? [];
                // isLastMessageSeen = true nếu có ai khác (không phải mình) đã xem
                const isSeenByOther = seenList.some(
                    u => String(u.userId) !== String(currentUserIdRef.current)
                );
                return {
                    ...prev,
                    seenByUsers: seenList,
                    isLastMessageSeen: isSeenByOther,
                };
            });
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

    async function handleSubmit(event, isThumbsUp = false) {
        if (event) event.preventDefault();

        // Stop typing khi gửi tin nhắn
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isTypingRef.current && isConnected && activeRoomId) {
            isTypingRef.current = false;
            publish("/app/typing", {
                roomId: activeRoomId,
                userId: currentUserId,
                userName: currentUser?.userName,
                avatarUrl: currentUser?.avatarUrl,
                typing: false,
            });
        }

        const hasImages = pendingImages.length > 0;
        let messageToSend = inputMessage.trim();
        if (isThumbsUp) {
            messageToSend = "👍";
        }

        // If no images and no text, nothing to send
        if (!hasImages && !messageToSend) return;
        if (!selectedUser || !currentUserId || (!targetUserId && !activeRoomId)) {
            return;
        }

        // Send text message first (if has text and not thumbs up with images)
        if (messageToSend && (!hasImages || isThumbsUp)) {
            sendTextMessage(messageToSend, isThumbsUp);
        }

        // Send text message if there's text along with images
        if (messageToSend && hasImages && !isThumbsUp) {
            sendTextMessage(messageToSend, false);
        }

        // Upload and send images
        if (hasImages) {
            await sendImageMessage();
        }
    }

    function sendTextMessage(messageToSend, isThumbsUp) {
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

    async function sendImageMessage() {
        const files = pendingImages.map(img => img.file);
        
        // Clear pending images and input immediately for responsive UX
        const imagesToClean = [...pendingImages];
        setPendingImages([]);
        setInputMessage("");

        setIsUploading(true);
        setUploadProgress(0);
        abortControllerRef.current = new AbortController();

        try {
            // Nén ảnh trước khi upload
            const compressedFiles = await Promise.all(
                files.map(file => compressImage(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.8 }))
            );

            const urls = await uploadImages(compressedFiles, {
                onProgress: (percent) => setUploadProgress(percent),
                signal: abortControllerRef.current.signal,
            });

            if (urls.length === 0) {
                console.error("Upload trả về 0 URLs");
                return;
            }

            const content = JSON.stringify(urls);
            const payload = {
                senderId: currentUserId,
                content,
                messageType: "IMAGE",
            };

            if (targetUserId) {
                payload.receiverId = targetUserId;
            }

            if (activeRoomId) {
                payload.roomId = activeRoomId;
            }

            if (!isConnected) {
                appendLocalMessage(content, "IMAGE");
                console.warn("Socket dang offline, tin nhan moi chi duoc hien thi tam tren FE.");
                return;
            }

            try {
                publish("/app/chat", payload);
            } catch (error) {
                console.error("Khong the gui tin nhan qua socket:", error);
                appendLocalMessage(content, "IMAGE");
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
                console.log("Upload đã bị hủy bởi người dùng");
                return;
            }
            console.error("Upload ảnh thất bại:", error);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            abortControllerRef.current = null;
            // Cleanup preview URLs
            imagesToClean.forEach(img => URL.revokeObjectURL(img.previewUrl));
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            handleSubmit(event);
        }
    }

    return (
        <div
            ref={dropZoneRef}
            className={`bg-white mb-1 border-t border-gray-200 px-4 w-full relative transition-colors ${isDragOver ? 'bg-blue-50 border-blue-300' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {isDragOver && (
                <div className= "absolute h-13 inset-0 bg-blue-50/80 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                    <div className="flex flex-col items-center">
                        <ImagePlus className="w-8 h-8 text-blue-500" />
                        <span className="text-blue-600 font-medium text-sm">Thả ảnh vào đây</span>
                    </div>
                </div>
            )}

            {/* Upload progress bar */}
            {isUploading && (
                <div className="px-1 pt-2 pb-1">
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 min-w-[35px] text-right">{uploadProgress}%</span>
                        <button
                            type="button"
                            onClick={cancelUpload}
                            className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                            title="Hủy upload"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Image preview grid */}
            {pendingImages.length > 0 && !isUploading && (
                <div className="flex gap-2 pt-3 pb-1 px-1 overflow-x-auto">
                    {pendingImages.map((img) => (
                        <div key={img.id} className="relative shrink-0 group">
                            <img
                                src={img.previewUrl}
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {pendingImages.length < MAX_IMAGES && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                            title="Thêm ảnh"
                        >
                            <ImagePlus className="w-5 h-5 text-gray-400" />
                        </button>
                    )}
                </div>
            )}

            <form className="flex gap-2 items-end w-full relative" onSubmit={handleSubmit}>
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                />

                {/* Image upload button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedUser || isUploading}
                    className="mb-3 disabled:cursor-not-allowed"
                    title="Gửi ảnh"
                >
                    <ImagePlus className={selectedUser && !isUploading ? "text-gray-400 hover:text-blue-600 cursor-pointer" : "text-gray-300"} size={22} />
                </button>

                <TextareaAutosize
                    value={inputMessage}
                    onChange={(event) => {
                        setInputMessage(event.target.value);
                        if (event.target.value.trim()) {
                            emitTyping();
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedUser ? "Nhập tin nhắn..." : "Hay chon mot cuoc tro chuyen"}
                    className="flex-1 py-3 outline-none resize-none w-full disabled:bg-white disabled:text-gray-400"
                    maxRows={7}
                    minRows={1}
                    disabled={!selectedUser || isUploading}
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
                        disabled={isUploading}
                    >
                        <SendHorizonal className="text-gray-400 hover:text-blue-600 cursor-pointer" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        className="mb-3 disabled:cursor-not-allowed"
                        disabled={!selectedUser || isUploading}
                    >
                        <ThumbsUp className={selectedUser ? "text-blue-500 hover:text-blue-600 cursor-pointer" : "text-gray-300"} />
                    </button>
                )}
            </form>
        </div>
    );
}
