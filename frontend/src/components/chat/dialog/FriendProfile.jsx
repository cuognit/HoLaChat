/**
 * File: FriendProfile.jsx
 * Chức năng: Thành phần giao diện (UI component) của ứng dụng.
 */
import React, { useState, useEffect } from "react";
import { useResponsive } from '../../../hooks/useResponsive';
import {
  X,
  UserMinus,
  UserPlus,
  Phone,
  MessageSquare,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../api/axiosConfig";
import { useChat } from "../../../hooks/useChat";
import { useNavigate } from "react-router-dom";
export default function FriendProfile({
  userId,
  initialUserData,
  onClose,
  onUnfriendSuccess,
  onStartChat,
  externalFriendshipStatus,
  externalFriendshipSenderId,
}) {
  const { currentUser } = useChat();
  const { isMobile } = useResponsive();
  const [userData, setUserData] = useState(initialUserData || null);
  const [isLoading, setIsLoading] = useState(!initialUserData);
  const [friendshipStatus, setFriendshipStatus] = useState("NONE"); // "NONE" | "SENT_PENDING" | "RECEIVED_PENDING" | "ACCEPTED"
  const [isUnfriendConfirm, setIsUnfriendConfirm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const navigate = useNavigate();
  // Sync trạng thái kết bạn real-time từ prop bên ngoài (selectedUser đã được WebSocket cập nhật)
  useEffect(() => {
    if (
      externalFriendshipStatus === undefined ||
      externalFriendshipStatus === null
    )
      return;

    if (externalFriendshipStatus === "PENDING") {
      // ChatRoomDTO dùng "PENDING" cho cả 2 phía, cần phân biệt chiều
      if (externalFriendshipSenderId && currentUser?.id) {
        const isSender =
          String(externalFriendshipSenderId) === String(currentUser.id);
        setFriendshipStatus(isSender ? "SENT_PENDING" : "RECEIVED_PENDING");
      }
    } else {
      setFriendshipStatus(externalFriendshipStatus); // "ACCEPTED", "NONE", ...
    }
  }, [externalFriendshipStatus, externalFriendshipSenderId, currentUser?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId && !initialUserData?.id) return;

      const targetId = userId || initialUserData.id;
      setIsLoading(true);
      try {
        // Fetch thông tin user nếu chưa có
        let uData = initialUserData;
        if (!uData) {
          const userRes = await api.get(`/auth/user/${targetId}`);
          if (userRes.data?.status === 200) {
            uData = userRes.data.data;
            setUserData(uData);
          }
        } else {
          setUserData(uData);
        }

        const statusRes = await api.get("/friendships/status", {
          params: { userId2: uData.id },
        });
        if (statusRes.data?.status === 200) {
          setFriendshipStatus(statusRes.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin trang cá nhân:", error);
        toast.error("Không thể tải thông tin người dùng!");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, initialUserData, currentUser?.id]);

  const formatBirthday = (dateString) => {
    if (!dateString) return "--/--/----";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "--/--/----";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "--/--/----";
    }
  };

  // 2. Xử lý gửi yêu cầu kết bạn
  const handleSendRequest = async () => {
    if (!currentUser?.id || !userData?.id) return;
    setIsActionLoading(true);
    try {
      const res = await api.post("/friendships/request", null, {
        params: { receiverId: userData.id },
      });
      if (res.data?.status === 200) {
        setFriendshipStatus("SENT_PENDING");
        toast.success("Đã gửi lời mời kết bạn thành công!");
      }
    } catch (error) {
      toast.error("Gửi lời mời thất bại!");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Xử lý đồng ý kết bạn
  const handleAcceptRequest = async () => {
    if (!currentUser?.id || !userData?.id) return;
    setIsActionLoading(true);
    try {
      const res = await api.post("/friendships/accept", null, {
        params: { senderId: userData.id },
      });
      if (res.data?.status === 200) {
        setFriendshipStatus("ACCEPTED");
        toast.success(`Bạn và ${userData.userName} đã trở thành bạn bè!`);
      }
    } catch (error) {
      toast.error("Không thể đồng ý kết bạn.");
    } finally {
      setIsActionLoading(false);
    }
  };
  const [isActionLoading2, setIsActionLoading2] = useState(false);
  // 4. Xử lý từ chối kết bạn
  const handleDeclineRequest = async () => {
    if (!currentUser?.id || !userData?.id) return;
    setIsActionLoading2(true);
    try {
      const res = await api.post("/friendships/decline", null, {
        params: { senderId: userData.id },
      });
      if (res.data?.status === 200) {
        setFriendshipStatus("NONE");
        toast.success(`Đã từ chối lời mời kết bạn từ ${userData.userName}`);
      }
    } catch (error) {
      toast.error("Từ chối lời mời kết bạn thất bại!");
    } finally {
      setIsActionLoading2(false);
    }
  };

  // 5. Xử lý hủy yêu cầu kết bạn (sender hủy PENDING của chính mình)
  const handleCancelRequest = async () => {
    if (!currentUser?.id || !userData?.id) return;
    setIsActionLoading(true);
    try {
      const res = await api.post("/friendships/cancel", null, {
        params: { receiverId: userData.id },
      });
      if (res.data?.status === 200) {
        setFriendshipStatus("NONE");
        toast.success("Đã hủy yêu cầu kết bạn!");
      }
    } catch (error) {
      toast.error("Hủy yêu cầu kết bạn thất bại!");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 6. Xử lý hủy kết bạn
  const handleUnfriend = async () => {
    if (!currentUser?.id || !userData?.id) return;

    setIsActionLoading(true);
    try {
      const res = await api.post("/friendships/unfriend", null, {
        params: {
          friendId: userData.id,
        },
      });
      if (res.data?.status === 200) {
        toast.success(`Đã hủy kết bạn với ${userData.userName}`);
        setFriendshipStatus("NONE");
        setIsUnfriendConfirm(false);
        if (onUnfriendSuccess) {
          onUnfriendSuccess(userData.id);
        }
      }
    } catch (error) {
      console.error("Lỗi hủy kết bạn:", error);
      toast.error("Hủy kết bạn thất bại!");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 7. Xử lý nút Nhắn tin
  const handleMessageClick = async () => {
    // Nếu có onStartChat (từ ContactDialog), ưu tiên dùng để đóng cả 2 dialog
    if (onStartChat) {
      onStartChat(userData);
      return;
    }
    // Fallback: tự xử lý (khi FriendProfile mở từ nơi khác)
    try {
      const res = await api.post("/chat-rooms/private", {
        userId: currentUser.id,
        otherUserId: userData.id,
      });

      if (res.data?.status === 200 && res.data.data) {
        const room = res.data.data;
        const normalizedRoom = {
          ...room,
          targetUserId: userData.id,
          targetUserName: userData.userName,
          targetAvatarUrl: userData.avatarUrl || "/avatar.jpg",
          isOnline: userData.isOnline,
          lastMessage: room.lastMessage || "Hãy gửi lời chào ngay!",
          lastMessageTime: room.lastMessageTime || null,
          unreadCount: 0,
          messages: [],
        };
        const targetRoomId =
          normalizedRoom.roomId || normalizedRoom.id || userData.id;
        navigate(`/c/${targetRoomId}`);
        onClose();
      }
    } catch (error) {
      console.error("Lỗi khi mở cuộc trò chuyện:", error);
      toast.error("Không thể mở cuộc trò chuyện!");
    }
  };

  if (isLoading) {
    return (
      <div className={`h-[350px] bg-white rounded-2xl flex items-center justify-center ${isMobile ? 'w-full' : 'w-[400px]'}`}>
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className={`max-w-full bg-white text-gray-800 flex flex-col font-sans select-none rounded-2xl shadow-2xl border border-gray-200 relative overflow-hidden ${isMobile ? 'w-full' : 'w-[400px]'}`}>
      {/* Popup xác nhận hủy kết bạn */}
      {isUnfriendConfirm && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl w-full max-w-[320px] text-center flex flex-col items-center gap-3">
            <div className="p-3 bg-red-50 text-red-500 rounded-full">
              <UserMinus size={28} />
            </div>
            <h4 className="text-base font-bold text-gray-900">Hủy kết bạn?</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bạn có chắc chắn muốn hủy kết bạn với{" "}
              <strong className="text-blue-500">{userData.userName}</strong>?
              Lịch sử trò chuyện vẫn sẽ được giữ lại.
            </p>
            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={() => setIsUnfriendConfirm(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                disabled={isActionLoading}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUnfriend}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-md"
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white shrink-0">
        <span className="text-lg font-bold text-gray-900">
          Thông tin tài khoản
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Cover Image */}
      <div className={`relative w-full bg-gray-100 shrink-0 overflow-hidden border-b border-gray-100 ${isMobile ? 'h-36' : 'h-44'}`}>
        {userData.coverUrl ? (
          <img
            src={userData.coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100" />
        )}
      </div>

      {/* Content Body */}
      <div className={`pb-6 pt-2 ${isMobile ? 'px-4' : 'px-6'}`}>
        {/* Avatar and User Name row */}
        <div className="flex items-end gap-4 -mt-10 mb-5 relative z-10">
          <div className="relative w-20 h-20">
            <img
              src={userData.avatarUrl || "/avatar.jpg"}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover border-4 border-white bg-white shadow-md ring-1 ring-gray-100/50"
            />
            <span
              className={`absolute bottom-1.5 right-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${userData.isOnline ? "bg-green-500" : "bg-gray-400"}`}
            ></span>
          </div>
          <div className="flex-1 pb-1">
            <h2
              className={`text-xl font-bold truncate text-gray-900 ${isMobile ? 'max-w-[180px]' : 'max-w-[210px]'}`}
              title={userData.userName}
            >
              {userData.userName}
            </h2>
          </div>
        </div>

        {/* Gọi điện & Nhắn tin Button Row */}
        <div className="flex gap-3 mb-6">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg cursor-pointer transition-colors">
            <Phone size={14} />
            Gọi điện
          </button>
          <button
            onClick={handleMessageClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs rounded-lg cursor-pointer transition-colors"
          >
            <MessageSquare size={14} />
            Nhắn tin
          </button>
        </div>

        {/* Thông tin cá nhân */}
        <div className="flex flex-col mb-6">
          <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider text-[11px]">
            Thông tin cá nhân
          </h3>

          <div className="flex py-3 border-b border-gray-100 items-center text-sm">
            <span className="w-28 text-gray-500 font-medium">Giới tính</span>
            <span className="text-gray-900 font-semibold">
              {userData.gender || "Nam"}
            </span>
          </div>

          <div className="flex py-3 border-b border-gray-100 items-center text-sm">
            <span className="w-28 text-gray-500 font-medium">Ngày sinh</span>
            <span className="text-gray-900 font-semibold">
              {formatBirthday(userData.birthday)}
            </span>
          </div>

          <div className="flex py-3 border-b border-gray-100 items-center text-sm">
            <span className="w-28 text-gray-500 font-medium">Email</span>
            <span
              className="text-gray-900 font-semibold truncate flex-1"
              title={userData.email}
            >
              {userData.email}
            </span>
          </div>
        </div>

        {/* Nút hành động tương tác thông minh dựa trên trạng thái kết bạn */}
        <div className="flex justify-center pt-4 border-t border-gray-100 mt-2 w-full">
          {/* TRẠNG THÁI 1: ĐÃ LÀ BẠN BÈ -> Hiển thị nút Hủy kết bạn (Màu đỏ) */}
          {friendshipStatus === "ACCEPTED" && (
            <button
              type="button"
              onClick={() => setIsUnfriendConfirm(true)}
              className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-all cursor-pointer font-bold text-xs border border-red-100 hover:border-red-200 w-full"
              disabled={isActionLoading}
            >
              <UserMinus size={14} />
              Hủy kết bạn
            </button>
          )}

          {/* TRẠNG THÁI 2: CHƯA KẾT BẠN -> Hiển thị nút Thêm bạn bè (Màu xanh dương) */}
          {friendshipStatus === "NONE" && (
            <button
              type="button"
              onClick={handleSendRequest}
              className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all cursor-pointer font-bold text-xs shadow-md w-full"
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <UserPlus size={14} />
              )}
              Thêm bạn bè
            </button>
          )}

          {/* TRẠNG THÁI 3: ĐÃ GỬI LỜI MỜI VÀ ĐANG CHỜ -> Hiển thị nút Huỷ yêu cầu */}
          {friendshipStatus === "SENT_PENDING" && (
            <button
              type="button"
              onClick={handleCancelRequest}
              disabled={isActionLoading}
              className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-600 hover:text-amber-900 rounded-full font-bold text-xs border border-amber-200 w-full transition-colors cursor-pointer"
            >
              {isActionLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}
              Huỷ yêu cầu kết bạn
            </button>
          )}

          {/* TRẠNG THÁI 4: ĐỐI PHƯƠNG GỬI LỜI MỜI -> HIỂN THỊ CẢ 2 NÚT CHẤP NHẬN & TỪ CHỐI SONG HÀNH */}
          {friendshipStatus === "RECEIVED_PENDING" && (
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={handleDeclineRequest}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 rounded-full transition-all cursor-pointer font-bold text-xs border border-gray-200"
                disabled={isActionLoading2}
              >
                {isActionLoading2 ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <div className="flex items-center gap-1 justify-center text-[12px]">
                    <X size={12} />
                    <span>Từ chối</span>
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={handleAcceptRequest}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-full transition-all cursor-pointer font-bold text-xs shadow-md"
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <div className="flex items-center gap-1 justify-center text-[12px]">
                    <Check size={12} />
                    <span>Chấp nhận</span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}