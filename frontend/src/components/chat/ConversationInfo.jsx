import {
  AlarmClock,
  Users,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  EyeOff,
  Pencil,
  Crown,
  UserPlus,
  LogOut,
  Trash2,
  Check,
  X,
  Link,
  Loader2,
  Camera,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "../../hooks/useChat";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { compressImage } from "../../utils/imageCompressor";
import MemberItem from "./MemberItem";
import api from "../../api/axiosConfig";
import { toast } from "sonner";
import ConfirmDialog from "./dialog/ConfirmDialog";
import AddMemberDialog from "./dialog/AddMemberDialog";
import DialogWindow from "./dialog/DialogWindow";
import ImageLightbox from "./ImageLightbox";
import { getImagesByRoom } from "../../services/messageService";

export default function ConversationInfo({ isMobile = false, isTablet = false, onClose }) {
  const { selectedUser, setSelectedUser, currentUser } = useChat();
  const { subscribe } = useChatSocket();
  const navigate = useNavigate();

  const addMemberRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const isGroup = selectedUser?.isGroup === true;
  const myRole = selectedUser?.currentUserRole; // "ADMIN" | "MEMBER"
  const isAdmin = myRole === "ADMIN";

  const [activeTab, setActiveTab] = useState("info"); // "info" | "members"

  // Trạng thái mở/đóng của các section
  const [openSections, setOpenSections] = useState({
    media: false,
    file: false,
    link: false,
    security: true,
  });
  const toggleSection = (section) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));

  // Trạng thái cho custom confirm dialog
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "danger",
    confirmText: "Xác nhận",
  });

  const closeConfirm = () =>
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

  // Members state
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const membersRoomIdRef = useRef(null);

  // Inline edit tên nhóm
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Invite link
  const [inviteUrl, setInviteUrl] = useState(null);

  // Image gallery
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPage, setGalleryPage] = useState(0);
  const [galleryHasMore, setGalleryHasMore] = useState(true);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const galleryRoomIdRef = useRef(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false);

  // Reset khi đổi phòng
  useEffect(() => {
    membersRoomIdRef.current = null;
    setMembers([]);
    setActiveTab("info");
    setEditingName(false);
    setInviteUrl(null);
    // Reset gallery
    setGalleryImages([]);
    setGalleryPage(0);
    setGalleryHasMore(true);
    setGalleryExpanded(false);
    galleryRoomIdRef.current = null;
  }, [selectedUser?.id, selectedUser?.roomId]);

  // Fetch gallery images khi mở section
  const fetchGalleryImages = useCallback(async (roomId, page) => {
    if (!roomId) return;
    setIsLoadingGallery(true);
    try {
      const images = await getImagesByRoom(roomId, page, 12);
      if (images.length < 12) setGalleryHasMore(false);
      setGalleryImages(prev => page === 0 ? images : [...prev, ...images]);
      galleryRoomIdRef.current = roomId;
    } catch {
      // Silent fail
    } finally {
      setIsLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    const roomId = selectedUser?.roomId || selectedUser?.id;
    if (openSections.media && roomId && galleryRoomIdRef.current !== roomId) {
      setGalleryImages([]);
      setGalleryPage(0);
      setGalleryHasMore(true);
      fetchGalleryImages(roomId, 0);
    }
  }, [openSections.media, selectedUser?.roomId, selectedUser?.id, fetchGalleryImages]);

  useEffect(() => {
    if (galleryPage > 0) {
      const roomId = selectedUser?.roomId || selectedUser?.id;
      fetchGalleryImages(roomId, galleryPage);
    }
  }, [galleryPage]);

  // Fetch members khi chuyển tab
  useEffect(() => {
    if (activeTab !== "members" || !isGroup) return;
    const roomId = selectedUser?.roomId || selectedUser?.id;
    if (!roomId || membersRoomIdRef.current === roomId) return;

    setIsLoadingMembers(true);
    api
      .get(`/rooms/${roomId}/members`)
      .then((res) => {
        setMembers(res.data?.data || []);
        membersRoomIdRef.current = roomId;
      })
      .catch(() => toast.error("Không thể tải danh sách thành viên"))
      .finally(() => setIsLoadingMembers(false));
  }, [activeTab, isGroup, selectedUser?.roomId, selectedUser?.id]);

  // Subscribe member events để cập nhật danh sách
  useEffect(() => {
    if (!isGroup || !selectedUser?.roomId) return;
    const roomId = selectedUser.roomId;

    const sub = subscribe(`/topic/room/${roomId}/members`, (message) => {
      try {
        const event =
          typeof message === "string" ? JSON.parse(message) : message;
        const { type, data } = event;

        if (type === "MEMBER_JOINED") {
          setMembers((prev) => {
            if (prev.find((m) => m.userId === data.userId)) return prev;
            return [...prev, data];
          });
          membersRoomIdRef.current = null; // invalidate cache
        }
        if (type === "MEMBER_LEFT") {
          setMembers((prev) => prev.filter((m) => m.userId !== data));
        }
        if (type === "ROLE_CHANGED") {
          setMembers((prev) =>
            prev.map((m) =>
              m.userId === data.userId ? { ...m, role: data.role } : m,
            ),
          );
          // Cập nhật myRole nếu là mình
          if (data.userId === currentUser?.id) {
            setSelectedUser((prev) =>
              prev ? { ...prev, currentUserRole: data.role } : prev,
            );
          }
        }
      } catch (e) {}
    });

    return () => sub?.unsubscribe();
  }, [isGroup, selectedUser?.roomId, currentUser?.id]);

  if (!selectedUser) return null;

  const roomId = selectedUser.roomId || selectedUser.id;

  // ---- Handlers ----
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const toastId = toast.loading("Đang tải ảnh nhóm mới...");
    try {
      // 1. Nén ảnh phía client-side trước khi upload
      const compressedFile = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 });

      // 2. Upload ảnh trực tiếp lên Cloudinary CDN từ client
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "hola_chat/group_avatars");

      const cloudinaryResponse = await axios.post(import.meta.env.VITE_CLOUDINARY_UPLOAD_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const secureUrl = cloudinaryResponse.data.secure_url;

      // 2. Gửi link URL vừa nhận được về backend Spring Boot để cập nhật
      const response = await api.patch(`/chat-rooms/${roomId}/avatar`, null, {
        params: {
          avatarUrl: secureUrl
        }
      });

      if (response.data?.status === 200) {
        toast.success("Cập nhật ảnh đại diện nhóm thành công!", { id: toastId });
        setSelectedUser(prev => prev ? { ...prev, avatarUrl: secureUrl } : prev);
      } else {
        toast.error("Cập nhật ảnh nhóm thất bại", { id: toastId });
      }
    } catch (error) {
      console.error("Lỗi upload avatar nhóm:", error);
      toast.error(error.response?.data?.message || "Không thể tải ảnh đại diện nhóm lên Cloudinary.", { id: toastId });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveName = async () => {
    if (
      !nameInput.trim() ||
      nameInput.trim() ===
        (selectedUser.roomName || selectedUser.targetUserName)
    ) {
      setEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await api.patch(`/chat-rooms/${roomId}/name`, null, {
        params: { name: nameInput.trim() },
      });
      setSelectedUser((prev) =>
        prev ? { ...prev, roomName: nameInput.trim() } : prev,
      );
      toast.success("Đã đổi tên nhóm");
    } catch {
      toast.error("Đổi tên thất bại");
    } finally {
      setIsSavingName(false);
      setEditingName(false);
    }
  };

  const handleCopyLink = async () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Đã sao chép link mời!");
      return;
    }
    setIsLoadingLink(true);
    try {
      const res = await api.get(`/chat-rooms/${roomId}/invite-link`);
      const url = res.data?.data?.url || res.data?.data;
      setInviteUrl(url);
      navigator.clipboard.writeText(url);
      toast.success("Đã sao chép link mời!");
    } catch {
      toast.error("Không thể lấy link mời");
    } finally {
      setIsLoadingLink(false);
    }
  };

  const handleKick = (targetUserId, targetUserName) => {
    setConfirmConfig({
      isOpen: true,
      title: "Xóa thành viên",
      message: `Bạn có chắc chắn muốn xóa ${targetUserName} khỏi nhóm?`,
      type: "danger",
      confirmText: "Xóa",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.delete(`/rooms/${roomId}/members/${targetUserId}`);
          setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
          toast.success(`Đã xóa ${targetUserName} khỏi nhóm`);
        } catch {
          toast.error("Thao tác thất bại");
        }
      },
    });
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await api.patch(
        `/rooms/${roomId}/members/${targetUserId}/role`,
        { role: newRole },
      );
      const updated = res.data?.data;
      if (updated) {
        setMembers((prev) =>
          prev.map((m) =>
            m.userId === targetUserId ? { ...m, role: newRole } : m,
          ),
        );
        toast.success(
          newRole === "ADMIN"
            ? "Đã nâng lên quản trị viên"
            : "Đã hạ xuống thành viên",
        );
      }
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleLeave = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Rời khỏi nhóm",
      message:
        "Bạn có chắc chắn muốn rời khỏi nhóm này? Các thành viên khác vẫn tiếp tục trò chuyện.",
      type: "warning",
      confirmText: "Rời nhóm",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.delete(`/rooms/${roomId}/members/${currentUser.id}`);
          toast.success("Đã rời nhóm");
          navigate("/");
        } catch (e) {
          toast.error(e.response?.data?.message || "Rời nhóm thất bại");
        }
      },
    });
  };

  const handleDissolve = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Giải tán nhóm",
      message:
        "Giải tán nhóm? Tất cả tin nhắn và dữ liệu nhóm sẽ bị xóa vĩnh viễn khỏi hệ thống!",
      type: "danger",
      confirmText: "Giải tán",
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.delete(`/chat-rooms/${roomId}`);
          toast.success("Đã giải tán nhóm");
          navigate("/");
        } catch {
          toast.error("Giải tán nhóm thất bại");
        }
      },
    });
  };

  // ---- Phân chia members theo role ----
  const admins = members.filter((m) => m.role === "ADMIN");
  const regularMembers = members.filter((m) => m.role === "MEMBER");

  const displayName = isGroup
    ? selectedUser.roomName || "Nhóm chat"
    : selectedUser.targetUserName || "User";

  const displayAvatar = isGroup
    ? selectedUser.avatarUrl
    : selectedUser.targetAvatarUrl || "/avatar.jpg";

  return (
    <div className={`shrink-0 bg-white border-l border-gray-200 h-screen flex flex-col overflow-hidden ${
      isMobile ? 'w-full fixed inset-0 z-30 border-l-0' : isTablet ? 'w-[300px]' : 'w-[340px]'
    }`}>
      {/* Header */}
      <div className="h-14 flex items-center border-b border-gray-200 shrink-0 px-4">
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1.5 mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer flex-shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-[17px] font-semibold text-gray-800 flex-1 text-center">
          Thông tin hội thoại
        </h2>
        {isMobile && <div className="w-9" />} {/* Spacer for centering */}
      </div>

      {/* Tabs — chỉ hiện với group */}
      {isGroup && (
        <div className="flex border-b border-gray-200 shrink-0">
          {["info", "members"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-all cursor-pointer
                                ${
                                  activeTab === tab
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
            >
              {tab === "info"
                ? "Thông tin"
                : `Thành viên${members.length > 0 ? ` (${members.length})` : ""}`}
            </button>
          ))}
        </div>
      )}

      {/* ===== TAB THÔNG TIN ===== */}
      {activeTab === "info" && (
        <div className="flex-1 overflow-y-auto">
          {/* Profile Info */}
          <div className="flex flex-col items-center py-5 border-b border-gray-100">
            {/* Avatar */}
            {isGroup ? (
              <div 
                className="relative group w-16 h-16 rounded-full cursor-pointer overflow-hidden border border-gray-200 mb-3 shadow-sm active:scale-95 transition-transform"
                onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                title="Nhấn để đổi ảnh nhóm"
              >
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-8 h-8"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                )}
                {/* Hover overlay với icon camera mượt mà */}
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {isUploadingAvatar ? (
                    <Loader2 size={18} className="text-white animate-spin" />
                  ) : (
                    <Camera size={18} className="text-white" />
                  )}
                </div>
              </div>
            ) : (
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border border-gray-200 mb-3"
              />
            )}

            {/* Input file ẩn dùng để đổi avatar nhóm */}
            {isGroup && (
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
            )}

            {/* Tên + inline edit */}
            {editingName ? (
              <div className="flex items-center gap-1.5 w-full px-6">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="flex-1 text-sm font-medium border-b-2 border-blue-400 outline-none py-0.5 text-center"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer"
                >
                  {isSavingName ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="p-1 text-gray-400 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-medium text-gray-900">
                  {displayName}
                </span>
                <button
                  onClick={() => {
                    setNameInput(displayName);
                    setEditingName(true);
                  }}
                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors cursor-pointer"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-col py-2 border-b border-gray-100">
            {!isGroup && (
              <>
                <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                  <AlarmClock
                    className="text-gray-600"
                    size={20}
                    strokeWidth={1.5}
                  />
                  <span className="text-[15px] text-gray-700">
                    Danh sách nhắc hẹn
                  </span>
                </button>
                <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                  <Users
                    className="text-gray-600"
                    size={20}
                    strokeWidth={1.5}
                  />
                  <span className="text-[15px] text-gray-700">Nhóm chung</span>
                </button>
              </>
            )}
            {isGroup && (
              <button
                onClick={handleCopyLink}
                disabled={isLoadingLink}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {isLoadingLink ? (
                  <Loader2 className="text-gray-400 animate-spin" size={20} />
                ) : (
                  <Link className="text-gray-600" size={20} strokeWidth={1.5} />
                )}
                <span className="text-[15px] text-gray-700">
                  {inviteUrl ? "Sao chép link mời" : "Lấy link mời nhóm"}
                </span>
              </button>
            )}
          </div>

          {/* Accordions */}
          <div className="flex-1">
            {/* Media */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => toggleSection("media")}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-[15px] font-medium text-gray-800">
                  Ảnh/Video
                </span>
                {openSections.media ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>
              {openSections.media && (
                <div className="px-4 pb-3 pt-1">
                  {galleryImages.length === 0 && !isLoadingGallery ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Chưa có Ảnh/Video được chia sẻ
                      <br />
                      trong hội thoại này
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                        {(galleryExpanded ? galleryImages : galleryImages.slice(0, 6)).map((url, index) => (
                          <div
                            key={`${url}-${index}`}
                            className="aspect-square cursor-pointer overflow-hidden bg-gray-100 hover:brightness-90 transition-all"
                            onClick={() => setLightboxIndex(index)}
                          >
                            <img
                              src={url}
                              alt={`Ảnh ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                      {galleryExpanded && galleryHasMore && (
                        <button
                          onClick={() => setGalleryPage(prev => prev + 1)}
                          disabled={isLoadingGallery}
                          className="w-full mt-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer font-medium disabled:text-gray-400"
                        >
                          {isLoadingGallery ? "Đang tải..." : "Xem thêm"}
                        </button>
                      )}
                      {!galleryExpanded && galleryImages.length > 6 && (
                        <button
                          onClick={() => setGalleryExpanded(true)}
                          className="w-full mt-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                          Xem tất cả
                        </button>
                      )}
                    </>
                  )}
                  {isLoadingGallery && galleryImages.length === 0 && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin text-blue-400 w-5 h-5" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Image Lightbox */}
            {lightboxIndex !== null && (
              <ImageLightbox
                images={galleryImages}
                currentIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onNavigate={(index) => setLightboxIndex(index)}
              />
            )}

            {/* File */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => toggleSection("file")}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-[15px] font-medium text-gray-800">
                  File
                </span>
                {openSections.file ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>
              {openSections.file && (
                <div className="px-4 pb-4 pt-1 flex justify-center">
                  <p className="text-sm text-gray-500 text-center">
                    Chưa có File được chia sẻ trong
                    <br />
                    hội thoại này
                  </p>
                </div>
              )}
            </div>

            {/* Security */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => toggleSection("security")}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-[15px] font-medium text-gray-800">
                  Thiết lập bảo mật
                </span>
                {openSections.security ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </button>
              {openSections.security && (
                <div className="flex flex-col">
                  <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <Clock
                      className="text-gray-800 mt-0.5"
                      size={22}
                      strokeWidth={1.5}
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] text-gray-800">
                          Tin nhắn tự xóa
                        </span>
                        <HelpCircle size={14} className="text-gray-400" />
                      </div>
                      <span className="text-[13px] text-gray-500 mt-0.5">
                        Không bao giờ
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <EyeOff
                        className="text-gray-800"
                        size={22}
                        strokeWidth={1.5}
                      />
                      <span className="text-[15px] text-gray-800">
                        Ẩn trò chuyện
                      </span>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <div className="w-10 h-[22px] bg-gray-300 rounded-full transition-colors"></div>
                      <div className="absolute left-[2px] top-[2px] w-[18px] h-[18px] bg-white rounded-full transition-transform shadow-sm"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons cho group */}
          {isGroup && (
            <div className="px-4 py-4 flex flex-col gap-2 border-t border-gray-100 mt-auto">
              <button
                onClick={handleLeave}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-orange-600 border border-orange-200 hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Rời khỏi nhóm
              </button>
              {isAdmin && (
                <button
                  onClick={handleDissolve}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                  Giải tán nhóm
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB THÀNH VIÊN ===== */}
      {activeTab === "members" && isGroup && (
        <div className="flex-1 overflow-y-auto">
          {/* Nút thêm thành viên */}
          {isAdmin && (
            <div className="px-3 pt-3 pb-1">
              <button
                onClick={() => addMemberRef.current?.open()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50/50 hover:bg-blue-50 border border-dashed border-blue-300 hover:border-blue-400 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
              >
                <UserPlus size={16} /> Thêm thành viên mới
              </button>
            </div>
          )}

          {isLoadingMembers ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-400 w-6 h-6" />
            </div>
          ) : (
            <div className="px-2 pb-4">
              {/* Quản trị viên */}
              {admins.length > 0 && (
                <>
                  <p className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    👑 Quản trị viên ({admins.length})
                  </p>
                  {admins.map((m) => (
                    <MemberItem
                      key={m.userId}
                      member={m}
                      myRole={myRole}
                      currentUserId={currentUser?.id}
                      roomId={roomId}
                      onRoleChange={handleRoleChange}
                      onKick={handleKick}
                    />
                  ))}
                </>
              )}
              {/* Thành viên */}
              {regularMembers.length > 0 && (
                <>
                  <p className="px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    👤 Thành viên ({regularMembers.length})
                  </p>
                  {regularMembers.map((m) => (
                    <MemberItem
                      key={m.userId}
                      member={m}
                      myRole={myRole}
                      currentUserId={currentUser?.id}
                      roomId={roomId}
                      onRoleChange={handleRoleChange}
                      onKick={handleKick}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />
      {/* Dialog Thêm thành viên nổi lên màn hình */}
      <DialogWindow
        dialogForm={
          <AddMemberDialog
            roomId={roomId}
            existingMembers={members}
            onClose={() => addMemberRef.current?.close()}
            onAdded={(newMembers) => {
              setMembers((prev) => {
                const existingIds = new Set(prev.map((m) => m.userId));
                const fresh = newMembers.filter(
                  (m) => !existingIds.has(m.userId),
                );
                return [...prev, ...fresh];
              });
            }}
          />
        }
        ref={addMemberRef}
        position={`m-auto p-0 bg-transparent border-none text-gray-800 rounded-2xl w-[480px] max-w-[90vw] shadow-2xl`}
      />
    </div>
  );
}
