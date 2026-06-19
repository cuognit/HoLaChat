/**
 * File: CreateGroupDialog.jsx
 * Chức năng: Thành phần giao diện (UI component) của ứng dụng.
 */
import { useState, useEffect, useRef } from "react";
import { useResponsive } from '../../../hooks/useResponsive';
import { X, ChevronLeft, Search, Users2, Check, Camera, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import api from "../../../api/axiosConfig";
import axios from "axios";
import { compressImage } from "../../../utils/imageCompressor";
import { useChat } from "../../../hooks/useChat";
import { useNavigate } from "react-router-dom";

export default function CreateGroupDialog({ onClose }) {
    const { currentUser } = useChat();
    const { isMobile } = useResponsive();
    const navigate = useNavigate();

    // Step 1 | 2
    const [step, setStep] = useState(1);

    // Bước 1 state
    const [groupName, setGroupName] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [nameError, setNameError] = useState("");
    const avatarInputRef = useRef(null);

    // Bước 2 state
    const [selectedMembers, setSelectedMembers] = useState([]); // [{id, userName, avatarUrl}]
    const [friends, setFriends] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const searchTimerRef = useRef(null);

    // Load bạn bè khi mở bước 2
    useEffect(() => {
        if (step === 2 && friends.length === 0) {
            fetchFriends();
        }
    }, [step]);

    const fetchFriends = async () => {
        setIsLoadingFriends(true);
        try {
            const res = await api.get("/friendships/friends");
            if (res.data?.status === 200) {
                setFriends(res.data.data || []);
            }
        } catch {
            toast.error("Không thể tải danh sách bạn bè");
        } finally {
            setIsLoadingFriends(false);
        }
    };

    // Debounce search 300ms
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        clearTimeout(searchTimerRef.current);

        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await api.get("/auth/search", { params: { email: query.trim() } });
                const results = (res.data?.data || []).filter(u => u.id !== currentUser?.id);
                setSearchResults(results);
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleStep1Next = () => {
        const trimmed = groupName.trim();
        if (!trimmed || trimmed.length < 2) {
            setNameError("Tên nhóm cần ít nhất 2 ký tự");
            return;
        }
        setNameError("");
        setStep(2);
    };

    const toggleMember = (user) => {
        setSelectedMembers(prev => {
            const exists = prev.find(m => m.id === user.id);
            if (exists) return prev.filter(m => m.id !== user.id);
            return [...prev, { id: user.id, userName: user.userName, avatarUrl: user.avatarUrl }];
        });
    };

    const isSelected = (userId) => selectedMembers.some(m => m.id === userId);

    const handleCreate = async () => {
        if (selectedMembers.length < 2) {
            toast.error("Cần chọn ít nhất 2 người (tổng nhóm ≥ 3 người)");
            return;
        }
        setIsCreating(true);
        try {
            let avatarUrl = null;

            // Upload ảnh trực tiếp lên Cloudinary CDN nếu có chọn ảnh (đã được nén phía client)
            if (avatarFile) {
                const compressedFile = await compressImage(avatarFile, { maxWidth: 800, maxHeight: 800, quality: 0.7 });
                const formData = new FormData();
                formData.append("file", compressedFile);
                formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                formData.append("folder", "hola_chat/group_avatars");

                const uploadRes = await axios.post(import.meta.env.VITE_CLOUDINARY_UPLOAD_URL, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                avatarUrl = uploadRes.data?.secure_url || null;
            }

            const res = await api.post("/chat-rooms/group", {
                roomName: groupName.trim(),
                avatarUrl,
                memberIds: selectedMembers.map(m => m.id)
            });

            if (res.data?.status === 200 && res.data?.data) {
                const room = res.data.data;
                toast.success(`Đã tạo nhóm "${groupName.trim()}" thành công!`);
                navigate(`/c/${room.id}`);
                handleClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Tạo nhóm thất bại!");
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setGroupName("");
        setAvatarFile(null);
        setAvatarPreview(null);
        setSelectedMembers([]);
        setSearchQuery("");
        setSearchResults([]);
        setNameError("");
        onClose?.();
    };

    // Hợp nhất friends và searchResults, tránh trùng
    const friendIds = new Set(friends.map(f => f.id));
    const extraResults = searchResults.filter(u => !friendIds.has(u.id) && u.id !== currentUser?.id);

    return (
        <div className={`max-w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col select-none font-sans ${isMobile ? 'w-full' : 'w-[480px]'}`}>
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-gray-100 shrink-0">
                {step === 2 && (
                    <button
                        onClick={() => setStep(1)}
                        className="mr-2 p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className="flex items-center gap-2 flex-1">
                    <Users2 size={20} className="text-blue-600" />
                    <span className="text-lg font-bold text-gray-900">
                        {step === 1 ? "Tạo nhóm mới" : "Thêm thành viên"}
                    </span>
                </div>
                <button
                    onClick={handleClose}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                    <X size={20} />
                </button>
            </div>

            {/* ===== BƯỚC 1 ===== */}
            {step === 1 && (
                <div className={`flex flex-col items-center py-6 gap-5 ${isMobile ? 'px-4' : 'px-8'}`}>
                    {/* Avatar upload */}
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-md">
                            {avatarPreview
                                ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                                : <Users2 size={36} className="text-blue-400" />
                            }
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Camera size={22} className="text-white" />
                        </div>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                    <p className="text-xs text-gray-400 -mt-2">Nhấn để thêm ảnh đại diện nhóm</p>

                    {/* Tên nhóm */}
                    <div className="w-full flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700">
                            Tên nhóm <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={e => { setGroupName(e.target.value); setNameError(""); }}
                            onKeyDown={e => e.key === "Enter" && handleStep1Next()}
                            placeholder="Nhập tên nhóm..."
                            maxLength={100}
                            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all
                                ${nameError
                                    ? "border-red-400 focus:border-red-500 bg-red-50"
                                    : "border-gray-200 focus:border-blue-500 bg-gray-50 focus:bg-white"
                                }`}
                        />
                        {nameError && <p className="text-xs text-red-500 font-medium">{nameError}</p>}
                        <p className="text-xs text-gray-400 text-right">{groupName.length}/100</p>
                    </div>

                    <button
                        onClick={handleStep1Next}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                        Tiếp theo →
                    </button>
                </div>
            )}

            {/* ===== BƯỚC 2 ===== */}
            {step === 2 && (
                <div className={`flex flex-col ${isMobile ? 'h-[65vh]' : 'h-[520px]'}`}>
                    {/* Search bar */}
                    <div className="px-4 pt-3 pb-2 shrink-0">
                        <div className="flex items-center bg-gray-100 focus-within:bg-white border border-transparent focus-within:border-blue-400 px-3 py-2 rounded-xl gap-2 transition-all">
                            <Search size={16} className="text-gray-400 shrink-0" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Tìm tên hoặc email..."
                                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                            />
                            {isSearching && <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />}
                        </div>
                    </div>

                    {/* Chip "đã chọn" */}
                    {selectedMembers.length > 0 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                            {selectedMembers.map(m => (
                                <span key={m.id} className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                    {m.userName}
                                    <button onClick={() => toggleMember(m)} className="hover:text-red-500 transition-colors cursor-pointer">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Danh sách */}
                    <div className="flex-1 overflow-y-auto px-2">
                        {/* Bạn bè */}
                        {isLoadingFriends ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-blue-400 w-6 h-6" />
                            </div>
                        ) : (
                            <>
                                {friends.length > 0 && (
                                    <>
                                        <p className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            Bạn bè ({friends.length})
                                        </p>
                                        {friends.map(friend => (
                                            <MemberSelectItem
                                                key={friend.id}
                                                user={friend}
                                                isSelected={isSelected(friend.id)}
                                                onToggle={() => toggleMember(friend)}
                                            />
                                        ))}
                                    </>
                                )}

                                {/* Kết quả tìm kiếm người lạ */}
                                {extraResults.length > 0 && (
                                    <>
                                        <p className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                                            Kết quả tìm kiếm
                                        </p>
                                        {extraResults.map(user => (
                                            <MemberSelectItem
                                                key={user.id}
                                                user={user}
                                                isSelected={isSelected(user.id)}
                                                onToggle={() => toggleMember(user)}
                                            />
                                        ))}
                                    </>
                                )}

                                {friends.length === 0 && extraResults.length === 0 && !isSearching && (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                                        <UserPlus size={32} className="stroke-[1.5] text-gray-300" />
                                        <p className="text-xs">
                                            {searchQuery ? "Không tìm thấy ai" : "Bạn chưa có bạn bè nào"}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`px-4 py-3 border-t border-gray-100 shrink-0 flex gap-3 ${isMobile ? 'flex-col items-stretch' : 'items-center justify-between'}`}>
                        <span className="text-xs text-gray-500 font-medium">
                            Đã chọn <strong className="text-blue-600">{selectedMembers.length}</strong> người
                            <span className="text-gray-400"> · Tổng: {selectedMembers.length + 1} (gồm bạn)</span>
                        </span>
                        <button
                            onClick={handleCreate}
                            disabled={isCreating || selectedMembers.length < 2}
                            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                            {isCreating ? <Loader2 size={14} className="animate-spin" /> : null}
                            {isCreating ? "Đang tạo..." : `Tạo nhóm (${selectedMembers.length + 1} người)`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function MemberSelectItem({ user, isSelected, onToggle }) {
    return (
        <div
            onClick={onToggle}
            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all mb-0.5
                ${isSelected
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
        >
            <div className="relative shrink-0">
                <img
                    src={user.avatarUrl || "/avatar.jpg"}
                    alt={user.userName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.userName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
        </div>
    );
}
