import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import {
  SendHorizonal,
  Smile,
  ThumbsUp,
  Paperclip,
  X,
  Loader2,
  Play,
  FileText,
} from "lucide-react";
import { useChat } from "../../hooks/useChat";
import { useChatSocket } from "../../hooks/useChatSocket";
import { normalizeIncomingMessage } from "../../utils/chatMessage";
import { compressImage } from "../../utils/imageCompressor";
import { uploadFiles as uploadToServer } from "../../services/messageService";
import EmojiPicker from "emoji-picker-react";

import { Quote } from "lucide-react";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export default function SendChat({ replyingToMessage, onCancelReply }) {
  const { selectedUser, setSelectedUser, currentUser } = useChat();
  const { isConnected, publish, subscribe } = useChatSocket();
  const currentUserId = currentUser?.id;
  const targetUserId = selectedUser?.targetUserId;
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

  // File upload state
  const [pendingFiles, setPendingFiles] = useState([]); // { id, file, name, previewUrl }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const dropZoneRef = useRef(null);

  const canSendMessage = useMemo(() => {
    return Boolean(
      selectedUser &&
      currentUserId &&
      (inputMessage.trim() || pendingFiles.length > 0),
    );
  }, [selectedUser, currentUserId, inputMessage, pendingFiles]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    currentUserIdRef.current = currentUserId;
  }, [selectedUser, currentUserId]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach(
        (f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl),
      );
    };
  }, []);

  // Clear pending files when switching conversations
  useEffect(() => {
    setPendingFiles((prev) => {
      prev.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
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
  }, [
    isConnected,
    activeRoomId,
    currentUserId,
    currentUser?.userName,
    currentUser?.avatarUrl,
    publish,
  ]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
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

  // ==================== File Handling ====================

  function validateAndAddFiles(fileList) {
    const files = Array.from(fileList);
    const validFiles = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`File "${file.name}" exceeds 25MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setPendingFiles((prev) => {
      const remaining = MAX_FILES - prev.length;
      const toAdd = validFiles.slice(0, remaining);
      const newFiles = toAdd.map((file) => ({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        previewUrl:
          file.type.startsWith("image/") || file.type.startsWith("video/")
            ? URL.createObjectURL(file)
            : null,
      }));
      return [...prev, ...newFiles];
    });
  }

  function removeFile(fileId) {
    setPendingFiles((prev) => {
      const f = prev.find((i) => i.id === fileId);
      if (f && f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((i) => i.id !== fileId);
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
    e.target.value = "";
  }

  // Paste handler (only images for clipboard)
  useEffect(() => {
    function handlePaste(e) {
      if (!selectedUser) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        validateAndAddFiles(imageFiles);
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
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

  function getLastMessagePreview(messageType, content) {
    if (messageType === "IMAGE") return "📷 Hình ảnh";
    if (messageType === "VIDEO") return "🎬 Video";
    if (messageType === "FILE") {
      try {
        const fileData = JSON.parse(content);
        return `📎 ${fileData.name || "File"}`;
      } catch {
        return "📎 File";
      }
    }
    return content;
  }

  function appendLocalMessage(content, messageType = "TEXT") {
    setSelectedUser((prevUser) => {
      if (!prevUser) return prevUser;

      const currentMessages = Array.isArray(prevUser.messages)
        ? prevUser.messages
        : [];
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
        lastMessage: getLastMessagePreview(messageType, content),
        lastMessageTime: now.toISOString(),
        lastMessageSenderId: currentUserIdRef.current,
        isLastMessageSeen: false,
        seenByUsers: [],
        messages: [...currentMessages, localMessage],
      };
    });
  }

  function appendMessageToSelectedUser(
    socketMessage,
    nextRoomId = socketMessage.roomId,
  ) {
    // Lọc tin nhắn thả cảm xúc dành cho người khác
    if (socketMessage.messageType === "SYSTEM" && socketMessage.content && socketMessage.content.startsWith("[REACT_FOR:")) {
      const content = socketMessage.content;
      const endIndex = content.indexOf("]");
      if (endIndex !== -1) {
        const receiverId = content.substring(11, endIndex);
        if (String(receiverId) !== String(currentUserIdRef.current)) {
          // Bỏ qua hoàn toàn tin nhắn này nếu không dành cho mình
          return;
        }
        // Nếu dành cho mình, xóa prefix để UI hiển thị đẹp
        socketMessage = {
          ...socketMessage,
          content: content.substring(endIndex + 1)
        };
      }
    }

    const normalizedMessage = normalizeIncomingMessage(
      socketMessage,
      currentUserIdRef.current,
    );

    setSelectedUser((prevUser) => {
      if (!prevUser) return prevUser;

      const currentMessages = Array.isArray(prevUser.messages)
        ? prevUser.messages
        : [];

      const alreadyExists = currentMessages.some(
        (message) => message.id === normalizedMessage.id,
      );
      if (alreadyExists) {
        return {
          ...prevUser,
          roomId: prevUser.roomId ?? nextRoomId,
        };
      }

      const localIndex = currentMessages.findLastIndex(
        (msg) =>
          typeof msg.id === "string" &&
          msg.id.startsWith("local-") &&
          msg.senderId === normalizedMessage.senderId &&
          msg.content === normalizedMessage.content,
      );

      let nextMessages;
      if (localIndex !== -1) {
        nextMessages = [...currentMessages];
        nextMessages[localIndex] = normalizedMessage;
      } else {
        nextMessages = [...currentMessages, normalizedMessage];
      }

      return {
        ...prevUser,
        roomId: prevUser.roomId ?? nextRoomId,
        lastMessage: getLastMessagePreview(
          normalizedMessage.messageType,
          normalizedMessage.content,
        ),
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

    const nextSubscription = subscribe(
      `/topic/room/${roomId}`,
      (roomMessage) => {
        if (roomMessage?.type === "MESSAGE_REACTION_UPDATE") {
          const updatedMessage = roomMessage.data;
          if (updatedMessage?.roomId !== roomId) return;
          setSelectedUser((prevUser) => {
            if (!prevUser) return prevUser;
            const currentMessages = Array.isArray(prevUser.messages) ? prevUser.messages : [];
            const nextMessages = currentMessages.map(msg => 
              msg.id === updatedMessage.id ? normalizeIncomingMessage(updatedMessage, currentUserIdRef.current) : msg
            );
            return { ...prevUser, messages: nextMessages };
          });
          return;
        }

        if (!roomMessage?.roomId || roomMessage.roomId !== roomId) {
          return;
        }

        appendMessageToSelectedUser(roomMessage, roomId);
      },
    );

    const nextSeenSubscription = subscribe(
      `/topic/room/${roomId}/seen`,
      (actionReq) => {
        setSelectedUser((prev) => {
          if (!prev) return prev;
          const seenList = actionReq?.seenByUsers ?? [];
          const isSeenByOther = seenList.some(
            (u) => String(u.userId) !== String(currentUserIdRef.current),
          );
          return {
            ...prev,
            seenByUsers: seenList,
            isLastMessageSeen: isSeenByOther,
          };
        });
      },
    );

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
      if (!message?.roomId) return;

      if (
        selectedUserRef.current &&
        message.senderId === currentUserIdRef.current
      ) {
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
    if (!isConnected || !activeRoomId) return;

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

    const hasFiles = pendingFiles.length > 0;
    let messageToSend = inputMessage.trim();
    if (isThumbsUp) {
      messageToSend = "👍";
    }

    if (!hasFiles && !messageToSend) return;
    if (!selectedUser || !currentUserId || (!targetUserId && !activeRoomId))
      return;

    // Send text message first if has text
    if (messageToSend && (!hasFiles || isThumbsUp)) {
      sendTextMessage(messageToSend, isThumbsUp);
    }

    if (messageToSend && hasFiles && !isThumbsUp) {
      sendTextMessage(messageToSend, false);
    }

    // Upload and send files
    if (hasFiles) {
      await sendAttachmentMessages();
    }
  }

  function sendTextMessage(messageToSend, isThumbsUp) {
    const payload = {
      senderId: currentUserId,
      content: messageToSend,
    };
    if (replyingToMessage) {
      payload.replyToId = replyingToMessage.id;
    }

    if (targetUserId) {
      payload.receiverId = targetUserId;
    }

    if (activeRoomId) {
      payload.roomId = activeRoomId;
    }

    if (!isConnected) {
      appendLocalMessage(messageToSend);
      if (!isThumbsUp) setInputMessage("");
      return;
    }

    try {
      publish("/app/chat", payload);
      if (!isThumbsUp) setInputMessage("");
      if (onCancelReply) onCancelReply();
    } catch (error) {
      appendLocalMessage(messageToSend);
      if (!isThumbsUp) setInputMessage("");
    }
  }

  async function sendAttachmentMessages() {
    const files = pendingFiles.map((f) => f.file);
    const filesToClean = [...pendingFiles];
    setPendingFiles([]);
    setInputMessage("");

    setIsUploading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      // Nén nếu là ảnh, giữ nguyên nếu là video/file
      const processedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.type.startsWith("image/")) {
            return compressImage(file, {
              maxWidth: 1920,
              maxHeight: 1920,
              quality: 0.8,
            });
          }
          return file;
        }),
      );

      const urls = await uploadToServer(processedFiles, {
        onProgress: (percent) => setUploadProgress(percent),
        signal: abortControllerRef.current.signal,
      });

      if (urls.length === 0) {
        console.error("Upload returned 0 URLs");
        return;
      }

      // Phân loại file để gửi các Message riêng biệt
      const payloads = [];
      let imageBatch = [];
      const remainingFiles = [...files];

      remainingFiles.forEach((file, index) => {
        const url = urls[index];
        if (!url) return;
        if (file.type.startsWith("image/")) {
          imageBatch.push(url);
        } else if (file.type.startsWith("video/")) {
          // Gửi video riêng nếu có ảnh tích lũy trước đó
          if (imageBatch.length > 0) {
            payloads.push({
              content: JSON.stringify(imageBatch),
              messageType: "IMAGE",
            });
            imageBatch = [];
          }
          payloads.push({ content: url, messageType: "VIDEO" });
        } else {
          // File tài liệu
          if (imageBatch.length > 0) {
            payloads.push({
              content: JSON.stringify(imageBatch),
              messageType: "IMAGE",
            });
            imageBatch = [];
          }
          const fileData = { name: file.name, url: url, size: file.size };
          payloads.push({
            content: JSON.stringify(fileData),
            messageType: "FILE",
          });
        }
      });

      // Gửi nốt ảnh còn lại
      if (imageBatch.length > 0) {
        payloads.push({
          content: JSON.stringify(imageBatch),
          messageType: "IMAGE",
        });
      }

      // Gửi từng payload
      for (const payload of payloads) {
        const msgPayload = {
          senderId: currentUserId,
          content: payload.content,
          messageType: payload.messageType,
        };
        if (replyingToMessage) msgPayload.replyToId = replyingToMessage.id;
        if (targetUserId) msgPayload.receiverId = targetUserId;
        if (activeRoomId) msgPayload.roomId = activeRoomId;

        if (!isConnected) {
          appendLocalMessage(payload.content, payload.messageType);
        } else {
          try {
            publish("/app/chat", msgPayload);
          } catch (error) {
            appendLocalMessage(payload.content, payload.messageType);
          }
        }
      }
      if (onCancelReply) onCancelReply();
    } catch (error) {
      if (error.name === "CanceledError" || error.name === "AbortError") {
        console.log("Upload cancelled by user");
        return;
      }
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
      filesToClean.forEach(
        (f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl),
      );
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
      className={`bg-white mb-1 border-t border-gray-200 px-4 w-full relative transition-colors ${isDragOver ? "bg-blue-50 border-blue-300" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute h-13 inset-0 bg-blue-50/80 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <div className="flex flex-col items-center">
            <Paperclip className="w-8 h-8 text-blue-500" />
            <span className="text-blue-600 font-medium text-sm">
              Thả file vào đây
            </span>
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
            <span className="text-xs text-gray-500 min-w-[35px] text-right">
              {uploadProgress}%
            </span>
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

      {/* File preview grid */}
      {pendingFiles.length > 0 && !isUploading && (
        <div className="flex gap-2 pt-3 pb-1 px-1 overflow-x-auto">
          {pendingFiles.map((f) => (
            <div key={f.id} className="relative shrink-0 group">
              {f.previewUrl ? (
                f.file.type.startsWith("video/") ? (
                  <div className="relative w-16 h-16">
                    <video
                      src={f.previewUrl}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    {/* Lớp phủ mờ màu đen và Icon Play màu trắng ở giữa */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 rounded-lg pointer-events-none">
                      <Play className="w-6 h-6 text-white fill-white shadow-sm" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={f.previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                )
              ) : (
                <div className="w-16 h-16 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-200 overflow-hidden p-1">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="text-[10px] text-gray-500 truncate w-full text-center mt-1">
                    {f.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm z-10"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {pendingFiles.length < 10 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              title="Thêm file đính kèm"
            >
              <Paperclip className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      )}

      {/* Reply Banner */}
      {replyingToMessage && (
        <div className="flex items-start justify-between bg-gray-200 border-l-4 border-blue-500 rounded-lg px-3 py-2 mb-2 mt-2 relative shadow-sm">
          <div className="flex-1 min-w-0 flex flex-col pr-6">
            <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-xs mb-0.5">
              <Quote className="w-3 h-3 fill-current rotate-180" />
              <span>
                Trả lời{" "}
                <span className="text-gray-800 ml-1">
                  {replyingToMessage.senderName || "Người dùng"}
                </span>
              </span>
            </div>
            {replyingToMessage.messageType === "IMAGE" ? (
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  let imgUrl = "";
                  try {
                    const urls = JSON.parse(replyingToMessage.content);
                    imgUrl = Array.isArray(urls)
                      ? urls[0]
                      : replyingToMessage.content;
                  } catch {
                    imgUrl = replyingToMessage.content;
                  }
                  return (
                    <img
                      src={imgUrl}
                      alt="Reply Thumbnail"
                      className="w-8 h-8 object-cover rounded shadow-sm border border-gray-200"
                    />
                  );
                })()}
                <span className="text-[13px] text-gray-500 italic">
                  [Hình ảnh]
                </span>
              </div>
            ) : replyingToMessage.messageType === "VIDEO" ? (
              <div className="flex items-center gap-2 mt-1">
                <video
                  src={replyingToMessage.content}
                  className="w-8 h-8 object-cover rounded shadow-sm border border-gray-200 bg-black"
                />
                <span className="text-[13px] text-gray-500 italic">
                  [Video]
                </span>
              </div>
            ) : replyingToMessage.messageType === "FILE" ? (
              (() => {
                let fileName = "File đính kèm";
                try {
                  const parsed = JSON.parse(replyingToMessage.content);
                  if (parsed.name) fileName = parsed.name;
                } catch {}
                return (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 bg-blue-50 border border-gray-200 rounded flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-[13px] text-gray-500 italic truncate">
                      [{fileName}]
                    </span>
                  </div>
                );
              })()
            ) : replyingToMessage.messageType === "CALL" ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[13px] text-gray-500 italic">
                  [Cuộc gọi thoại]
                </span>
              </div>
            ) : (
              <p className="text-[13px] text-gray-600 truncate">
                {replyingToMessage.content}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-full hover:bg-gray-200/50 transition-colors"
            title="Hủy trả lời"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form
        className="flex gap-2 items-end w-full relative"
        onSubmit={handleSubmit}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedUser || isUploading}
          className="mb-3 disabled:cursor-not-allowed"
          title="Đính kèm"
        >
          <Paperclip
            className={
              selectedUser && !isUploading
                ? "text-gray-400 hover:text-blue-600 cursor-pointer"
                : "text-gray-300"
            }
            size={22}
          />
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
          placeholder={
            selectedUser ? "Nhập tin nhắn..." : "Hay chon mot cuoc tro chuyen"
          }
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
            <Smile
              className={
                selectedUser
                  ? "text-gray-400 hover:text-blue-600 cursor-pointer"
                  : "text-gray-300"
              }
            />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-10 right-0 z-50 shadow-lg rounded-lg">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>
        {canSendMessage ? (
          <button type="submit" className="mb-2.5" disabled={isUploading}>
            <SendHorizonal className="text-gray-400 hover:text-blue-600 cursor-pointer" />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            className="mb-3 disabled:cursor-not-allowed"
            disabled={!selectedUser || isUploading}
          >
            <ThumbsUp
              className={
                selectedUser
                  ? "text-blue-500 hover:text-blue-600 cursor-pointer"
                  : "text-gray-300"
              }
            />
          </button>
        )}
      </form>
    </div>
  );
}
