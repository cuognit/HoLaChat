import { useState, useEffect, useMemo } from "react";
import { Search, X, Check, FileText } from "lucide-react";
import api from "../../../api/axiosConfig";
import { normalizeChatRoom } from "../../../hooks/useRoomList";
import { useChat } from "../../../hooks/useChat";
import { useChatSocket } from "../../../hooks/useChatSocket";
import { toast } from "sonner";

export default function ShareMessageModal({ isOpen, onClose, messageData }) {
  const { currentUser } = useChat();
  const { publish, isConnected } = useChatSocket();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("gần-đây"); // "gần-đây", "nhóm", "bạn-bè"
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set()); // Lưu roomId hoặc targetUserId
  const [extraMessage, setExtraMessage] = useState("");

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    setIsLoading(true);
    api
      .get(`/chat-rooms/user/${currentUser.id}`)
      .then((res) => {
        const normalizedRooms = Array.isArray(res.data?.data)
          ? res.data.data.map((room) =>
              normalizeChatRoom(room, currentUser.id, currentUser.userName),
            )
          : [];
        setRooms(normalizedRooms.filter((r) => r.id > 0)); // Bỏ qua lời mời kết bạn (id < 0)
      })
      .catch((err) => {
        console.error("Lỗi lấy danh sách phòng:", err);
        toast.error("Không thể tải danh sách cuộc trò chuyện");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, currentUser?.id]);

  // Reset state khi mở lại
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setExtraMessage("");
      setSelectedIds(new Set());
      setActiveTab("gần-đây");
    }
  }, [isOpen]);

  const filteredRooms = useMemo(() => {
    let result = rooms;

    // Tab filter
    if (activeTab === "nhóm") {
      result = result.filter((r) => r.isGroup);
    } else if (activeTab === "bạn-bè") {
      result = result.filter((r) => !r.isGroup);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const name = r.isGroup ? r.roomName : r.targetUserName;
        return name?.toLowerCase().includes(query);
      });
    }

    return result;
  }, [rooms, activeTab, searchQuery]);

  const toggleSelection = (room) => {
    const id = room.roomId || room.targetUserId;
    if (!id) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShare = () => {
    if (selectedIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất 1 người nhận");
      return;
    }

    if (!isConnected) {
      toast.error("Đang mất kết nối, vui lòng thử lại sau");
      return;
    }

    let successCount = 0;

    selectedIds.forEach((id) => {
      const room = rooms.find((r) => r.roomId === id || r.targetUserId === id);
      if (!room) return;

      // 1. Gửi tin nhắn gốc (Forwarded)
      const forwardPayload = {
        senderId: currentUser.id,
        content: messageData.content,
        messageType: messageData.messageType,
        forwarded: true,
      };

      if (room.roomId) {
        forwardPayload.roomId = room.roomId;
      } else if (room.targetUserId) {
        forwardPayload.receiverId = room.targetUserId;
      }

      try {
        publish("/app/chat", forwardPayload);

        // 2. Gửi thêm tin nhắn chú thích (nếu có)
        if (extraMessage.trim()) {
          const extraPayload = {
            senderId: currentUser.id,
            content: extraMessage.trim(),
            messageType: "TEXT",
            forwarded: false,
          };
          if (room.roomId) extraPayload.roomId = room.roomId;
          else if (room.targetUserId)
            extraPayload.receiverId = room.targetUserId;

          // Delay nhẹ để đảm bảo thứ tự
          setTimeout(() => {
            publish("/app/chat", extraPayload);
          }, 200);
        }

        successCount++;
      } catch (error) {
        console.error("Lỗi khi chia sẻ:", error);
      }
    });

    if (successCount > 0) {
      toast.success(`Đã chia sẻ đến ${successCount} cuộc trò chuyện`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[450px] bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Chia sẻ</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white border border-transparent focus-within:border-blue-500 transition-all">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 border-b border-gray-100 gap-6 mt-2">
          <button
            onClick={() => setActiveTab("gần-đây")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === "gần-đây" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Gần đây
            {activeTab === "gần-đây" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("nhóm")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === "nhóm" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Nhóm trò chuyện
            {activeTab === "nhóm" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("bạn-bè")}
            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === "bạn-bè" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            Bạn bè
            {activeTab === "bạn-bè" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 min-h-[250px]">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((room) => {
              const id = room.roomId || room.targetUserId;
              const isSelected = selectedIds.has(id);
              return (
                <div
                  key={id}
                  onClick={() => toggleSelection(room)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    )}
                  </div>
                  <img
                    src={
                      room.isGroup
                        ? room.avatarUrl
                        : room.targetAvatarUrl ||
                          room.avatarUrl ||
                          "/avatar.jpg"
                    }
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <span className="text-sm font-medium text-gray-800 truncate flex-1">
                    {room.isGroup ? room.roomName : room.targetUserName}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              Không tìm thấy kết quả
            </div>
          )}
        </div>

        {/* Preview Message & Extra Input */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 mb-3 flex gap-3 items-start shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
            {messageData?.messageType === "IMAGE" ? (
              <img
                src={(() => {
                  try {
                    return JSON.parse(messageData.content)[0];
                  } catch {
                    return messageData.content;
                  }
                })()}
                className="w-full h-full object-cover rounded-lg"
                alt=""
              />
            ) : messageData?.messageType === "VIDEO" ? (
              <video
                src={messageData.content}
                className="w-full h-full object-cover rounded-lg bg-black"
              />
            ) : messageData?.messageType === "FILE" ? (
              <FileText className="w-5 h-5 text-blue-500" />
            ) : (
              <span className="font-bold text-xs">
                A<span className="lowercase">a</span>
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-bold text-gray-800">
              Chia sẻ{" "}
              {messageData?.messageType === "IMAGE"
                ? "hình ảnh"
                : messageData?.messageType === "VIDEO"
                  ? "video"
                  : messageData?.messageType === "FILE"
                    ? "file đính kèm"
                    : "tin nhắn"}
            </h4>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {messageData?.messageType === "IMAGE"
                ? "[Hình ảnh]"
                : messageData?.messageType === "VIDEO"
                  ? "[Video]"
                  : messageData?.messageType === "FILE"
                    ? (() => {
                        try {
                          return `[${JSON.parse(messageData.content).name}]`;
                        } catch {
                          return "[File đính kèm]";
                        }
                      })()
                    : messageData?.content}
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleShare}
            disabled={selectedIds.size === 0}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
          >
            Chia sẻ
          </button>
        </div>
      </div>
    </div>
  );
}
