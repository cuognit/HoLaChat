import React, { useState, useEffect, useRef } from "react";
import { Search, UserPlus, MessageSquare, Check, X, Users, Loader2, MoreHorizontal, UserMinus, Info } from "lucide-react";
import { toast } from "sonner";
import api from "../../../api/axiosConfig";
import { useChat } from "../../../hooks/useChat";
import { useNavigate } from "react-router-dom";
import DialogWindow from "./DialogWindow";
import FriendProfile from "./FriendProfile";
export default function ContactDialog({ onClose, refreshKey }) {
    const { currentUser, setSelectedUser } = useChat();
    const [activeTab, setActiveTab] = useState("friends"); // "friends" | "add-friend"
    const navigate = useNavigate();
    
    // Trạng thái tab bạn bè
    const [friends, setFriends] = useState([]);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);

    // Trạng thái dropdown menu cho từng bạn bè
    const [activeMenuId, setActiveMenuId] = useState(null);
    const dropdownRef = useRef(null);

    // Dialog bạn bè
    const friendProfileRef = useRef();
    const [selectedFriendForProfile, setSelectedFriendForProfile] = useState(null);
    const [friendForUnfriend, setFriendForUnfriend] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Trạng thái tab tìm kiếm
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [friendshipStatus, setFriendshipStatus] = useState("NONE");
    const [actionLoading, setActionLoading] = useState(false);

    // Đóng dropdown khi click ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Tải danh sách bạn bè
    const fetchFriends = async () => {
        if (!currentUser?.id) return;
        setIsLoadingFriends(true);
        try {
            const res = await api.get("/friendships/friends");
            if (res.data?.status === 200) {
                setFriends(res.data.data || []);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách bạn bè:", error);
            toast.error("Không thể tải danh sách bạn bè");
        } finally {
            setIsLoadingFriends(false);
        }
    };

    // Fetch khi component mount lần đầu
    useEffect(() => {
        fetchFriends();
    }, []);

    // Fetch lại mỗi khi refreshKey thay đổi (mỗi lần dialog được mở)
    useEffect(() => {
        if (refreshKey > 0) {
            fetchFriends();
        }
    }, [refreshKey]);

    // Tìm kiếm người dùng bằng email
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchEmail.trim()) {
            toast.warning("Vui lòng nhập email để tìm kiếm!");
            return;
        }

        setIsSearching(true);
        setSearchResult(null);
        try {
            const response = await api.get(`/auth/search`, {
                params: { email: searchEmail.trim() }
            });
            const results = response.data?.data ?? [];
            
            if (results.length > 0) {
                const foundUser = results[0];
                setSearchResult(foundUser);

                const statusRes = await api.get("/friendships/status", {
                    params: { userId2: foundUser.id }
                });
                if (statusRes.data?.status === 200) {
                    setFriendshipStatus(statusRes.data.data);
                }
            } else {
                toast.info("Không tìm thấy người dùng nào với email này!");
            }
        } catch (error) {
            console.error("Lỗi tìm kiếm:", error);
            toast.error("Tìm kiếm thất bại!");
        } finally {
            setIsSearching(false);
        }
    };

    // Gửi lời mời kết bạn
    const handleSendRequest = async () => {
        if (!currentUser?.id || !searchResult?.id) return;
        setActionLoading(true);
        try {
            const res = await api.post("/friendships/request", null, {
                params: { receiverId: searchResult.id }
            });
            if (res.data?.status === 200) {
                setFriendshipStatus("SENT_PENDING");
                toast.success("Đã gửi lời mời kết bạn thành công!");
                
            }
        } catch (error) {
            console.error("Lỗi gửi lời mời kết bạn:", error);
            toast.error(error.response?.data?.message || "Gửi lời mời kết bạn thất bại!");
        } finally {
            setActionLoading(false);
        }
    };

    // Đồng ý kết bạn
    const handleAcceptRequest = async () => {
        if (!currentUser?.id || !searchResult?.id) return;
        setActionLoading(true);
        try {
            const res = await api.post("/friendships/accept", null, {
                params: { senderId: searchResult.id }
            });
            if (res.data?.status === 200) {
                setFriendshipStatus("ACCEPTED");
                toast.success(`Bạn và ${searchResult.userName} đã trở thành bạn bè!`);
            }
        } catch (error) {
            console.error("Lỗi đồng ý kết bạn:", error);
            toast.error("Không thể đồng ý kết bạn.");
        } finally {
            setActionLoading(false);
        }
    };

    // Nhắn tin với bạn bè
    const handleStartChat = async (friend) => {
        try {
            const res = await api.post("/chat-rooms/private", {
                userId: currentUser.id,
                otherUserId: friend.id
            });
            
            if (res.data?.status === 200 && res.data.data) {
                const room = res.data.data;
                const normalizedRoom = {
                    ...room,
                    targetUserId: friend.id,
                    targetUserName: friend.userName,
                    targetAvatarUrl: friend.avatarUrl || "/avatar.jpg",
                    isOnline: friend.isOnline,
                    lastMessage: room.lastMessage || "Hãy gửi lời chào ngay!",
                    lastMessageTime: room.lastMessageTime || null,
                    unreadCount: 0,
                    messages: []
                };                                      
                const targetRoomId = normalizedRoom.roomId || normalizedRoom.id || friend.id;
                navigate(`/c/${targetRoomId}`);            
                onClose();         
            }
        } catch (error) {
            console.error("Lỗi khi mở cuộc trò chuyện:", error);
            toast.error("Không thể mở cuộc trò chuyện!");
        }
    };

    // Mở Dialog thông tin chi tiết bạn bè
    const handleOpenProfile = (friend) => {
        setSelectedFriendForProfile(friend);
        setActiveMenuId(null);
        setTimeout(() => {
            friendProfileRef.current.open();
        }, 100);
    };

    // Click nút hủy kết bạn từ danh sách (hiện dialog confirm)
    const handleConfirmUnfriend = (friend) => {
        setFriendForUnfriend(friend);
        setActiveMenuId(null);
    };

    // Tiến hành hủy kết bạn
    const handleExecuteUnfriend = async () => {
        if (!currentUser?.id || !friendForUnfriend?.id) return;
        setIsActionLoading(true);
        try {
            const res = await api.post("/friendships/unfriend", null, {
                params: {
                    friendId: friendForUnfriend.id
                }
            });
            if (res.data?.status === 200) {
                toast.success(`Đã hủy kết bạn với ${friendForUnfriend.userName}`);
                setFriends(prev => prev.filter(f => f.id !== friendForUnfriend.id));
                setFriendForUnfriend(null);
            }
        } catch (error) {
            toast.error("Hủy kết bạn thất bại!");
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="w-[450px] max-w-full bg-white text-gray-800 flex flex-col font-sans select-none rounded-2xl shadow-2xl border border-gray-200 overflow-visible relative">
            
            {/* Modal Confirm Unfriend nhỏ phía trên */}
            {friendForUnfriend && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 rounded-2xl p-4">
                    <div className="bg-white rounded-2xl p-5 shadow-2xl w-full max-w-[300px] text-center flex flex-col items-center gap-3">
                        <div className="p-3 bg-red-50 text-red-500 rounded-full">
                            <UserMinus size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900">Hủy kết bạn?</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Bạn có chắc chắn muốn hủy kết bạn với <strong>{friendForUnfriend.userName}</strong>? Lịch sử chat vẫn sẽ được giữ lại.
                        </p>
                        <div className="flex gap-2 w-full mt-2">
                            <button
                                onClick={() => setFriendForUnfriend(null)}
                                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-[11px] font-semibold cursor-pointer transition-colors"
                                disabled={isActionLoading}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleExecuteUnfriend}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-[11px] font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-md"
                                disabled={isActionLoading}
                            >
                                {isActionLoading ? <Loader2 size={12} className="animate-spin" /> : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-lg font-bold text-gray-900">Danh bạ</span>
                </div>
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

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab("friends")}
                    className={`flex-1 py-3 text-center text-sm font-semibold relative transition-colors ${
                        activeTab === "friends" ? "text-blue-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                    Bạn bè ({friends.length})
                    {activeTab === "friends" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("add-friend")}
                    className={`flex-1 py-3 text-center text-sm font-semibold relative transition-colors ${
                        activeTab === "add-friend" ? "text-blue-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                    Tìm kiếm kết bạn
                    {activeTab === "add-friend" && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
                    )}
                </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 h-[350px] overflow-y-auto flex flex-col">
                {activeTab === "friends" ? (
                    isLoadingFriends ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : friends.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {friends.map((friend) => (
                                <div
                                    key={friend.id}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-all border border-gray-50 hover:border-gray-100 relative"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={friend.avatarUrl || "/avatar.jpg"}
                                                alt={friend.userName}
                                                className="w-11 h-11 rounded-full object-cover border border-gray-200"
                                            />
                                            <span
                                                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                                    friend.isOnline ? "bg-green-500" : "bg-gray-400"
                                                }`}
                                            ></span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-800">{friend.userName}</h4>
                                            <p className="text-xs text-gray-400 truncate w-[180px]">{friend.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 z-10" ref={activeMenuId === friend.id ? dropdownRef : null}>
                                        <button
                                            onClick={() => handleStartChat(friend)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                                        >
                                            <MessageSquare size={12} />
                                            Nhắn tin
                                        </button>

                                        {/* Nút 3 chấm */}
                                        <button
                                            onClick={() => setActiveMenuId(activeMenuId === friend.id ? null : friend.id)}
                                            className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                                            title="Tùy chọn"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>

                                        {/* Dropdown Menu của nút 3 chấm */}
                                        {activeMenuId === friend.id && (
                                            <div className="absolute right-2 top-11 bg-white border border-gray-100 rounded-xl shadow-xl w-32 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                                <button
                                                    onClick={() => handleOpenProfile(friend)}
                                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Info size={13} className="text-gray-400" />
                                                    Thông tin
                                                </button>
                                                <button
                                                    onClick={() => handleConfirmUnfriend(friend)}
                                                    className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer border-t border-gray-50"
                                                >
                                                    <UserMinus size={13} className="text-red-400" />
                                                    Hủy kết bạn
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <Users size={32} className="stroke-[1.5] text-gray-300" />
                            <p className="text-xs font-medium">Danh sách bạn bè trống</p>
                        </div>
                    )
                ) : (
                    /* Tab Tìm kiếm */
                    <div className="flex flex-col gap-4 flex-1">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="flex-1 flex items-center bg-gray-100 focus-within:bg-white border border-transparent focus-within:border-gray-200 px-3 py-2 rounded-xl gap-2 transition-all">
                                <Search className="text-gray-400 w-4 h-4" />
                                <input
                                    type="email"
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    placeholder="Nhập email cần tìm..."
                                    className="outline-none w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:bg-blue-400"
                            >
                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tìm kiếm"}
                            </button>
                        </form>

                        {searchResult ? (
                            <div className="mt-4 flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <img
                                    src={searchResult.avatarUrl || "/avatar.jpg"}
                                    alt={searchResult.userName}
                                    className="w-16 h-16 rounded-full object-cover border border-gray-200 shadow-sm"
                                />
                                <h4 className="mt-2 text-base font-bold text-gray-800">{searchResult.userName}</h4>
                                <p className="text-xs text-gray-400">{searchResult.email}</p>

                                <div className="mt-4 w-full flex justify-center">
                                    {friendshipStatus === "NONE" && (
                                        <button
                                            onClick={handleSendRequest}
                                            disabled={actionLoading}
                                            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full text-sm font-semibold shadow-md cursor-pointer transition-all"
                                        >
                                            <UserPlus size={16} />
                                            Thêm bạn bè
                                        </button>
                                    )}

                                    {friendshipStatus === "SENT_PENDING" && (
                                        <span className="px-5 py-2 bg-gray-200 text-gray-500 rounded-full text-xs font-semibold">
                                            Đã gửi lời mời kết bạn
                                        </span>
                                    )}

                                    {friendshipStatus === "RECEIVED_PENDING" && (
                                        <button
                                            onClick={handleAcceptRequest}
                                            disabled={actionLoading}
                                            className="flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full text-sm font-semibold shadow-md cursor-pointer transition-all"
                                        >
                                            <Check size={16} />
                                            Chấp nhận lời mời
                                        </button>
                                    )}

                                    {friendshipStatus === "ACCEPTED" && (
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                                <Check size={14} />
                                                Đã là bạn bè
                                            </span>
                                            <button
                                                onClick={() => handleStartChat(searchResult)}
                                                className="mt-1 flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                                            >
                                                <MessageSquare size={13} />
                                                Nhắn tin ngay
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 mt-8">
                                <Search size={32} className="stroke-[1.5] text-gray-300" />
                                <p className="text-xs font-medium text-center">Tìm kiếm bạn bè bằng địa chỉ Email</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Dialog phụ để mở profile từ danh bạ */}
            <DialogWindow 
                dialogForm={
                    selectedFriendForProfile && (
                        <FriendProfile 
                            userId={selectedFriendForProfile.id} 
                            initialUserData={selectedFriendForProfile}
                            onClose={() => {
                                friendProfileRef.current.close();
                                setSelectedFriendForProfile(null);
                            }}
                            onUnfriendSuccess={(unfriendedId) => {
                                // Xóa bạn bè ra khỏi danh sách friends cục bộ sau khi unfriend thành công
                                setFriends(prev => prev.filter(f => f.id !== unfriendedId));
                            }}
                            onStartChat={(friend) => {
                                // Đóng FriendProfile trước
                                friendProfileRef.current.close();
                                setSelectedFriendForProfile(null);
                                // Sau đó mở chat và đóng ContactDialog luôn
                                handleStartChat(friend);
                            }}
                        />
                    )
                } 
                ref={friendProfileRef} 
                position={`m-auto p-0 bg-transparent border-none text-gray-800 rounded-2xl w-[400px] max-w-[90vw] shadow-2xl`} 
            />
        </div>
    );
}