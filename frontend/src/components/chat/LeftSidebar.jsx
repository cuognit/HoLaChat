/**
 * File: LeftSidebar.jsx
 * Chức năng: Thành phần giao diện (UI component) của ứng dụng.
 */
import { Search, UserPlus, Users2, MessageSquare, Contact, Cloud, Folder, SquareCheck, Briefcase, Settings, ChevronDown, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ItemUser from "./ItemUser";
import DialogWindow from "./dialog/DialogWindow";
import ContactDialog from "./dialog/ContactDialog";
import CreateGroupDialog from "./dialog/CreateGroupDialog";
import { useChat } from "../../hooks/useChat";
import { useChatSocket } from "../../hooks/useChatSocket";
import api from '../../api/axiosConfig';
import { searchUsers } from "../../services/userService";
import { useNavigate, useParams } from "react-router-dom";
import Menu from "./dialog/Menu";
import SettingsMenu from "./dialog/SettingsMenu"; // Import SettingsMenu mới lập
import Profile from "./dialog/Profile";
import ConfirmLogout from "./dialog/ConfirmLogout";
import { DashRing } from "../LoadingUI";
import { toast } from "sonner";
import { useRoomList } from "../../hooks/useRoomList";

export default function LeftSidebar({ avatarUrl, name, email, isMobile = false, isTablet = false, onSelectAndNavigate }) {
 
    const menuRef = useRef();
    const settingsMenuRef = useRef(); // Khai báo tham chiếu cho menu cài đặt mới
    const profileRef = useRef();
    const logoutRef = useRef();
    const contactRef = useRef();
    const createGroupRef = useRef();
    const [contactRefreshKey, setContactRefreshKey] = useState(0);
    const { selectedUser, setSelectedUser, currentUser, updateUserStatus, updateTypingUser, typingUsersMap } = useChat();
    const { subscribe, publish, isConnected } = useChatSocket();

    const { users, setUsers, urlRoomId, navigate } = useRoomList(
        currentUser, selectedUser, setSelectedUser, updateUserStatus, updateTypingUser, isConnected, subscribe, publish
    );

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef(null);

    // Quản lý tab
    const [activeTab, setActiveTab] = useState("ưu-tiên");

    // Xử lý mở Menu khi click Avatar
    function handleClick() {
        menuRef.current.open();
    }

    // Xử lý mở Menu Cài đặt khi click icon Bánh răng
    function handleSettingsClick() {
        settingsMenuRef.current.open();
    }

    function handleSelectUser(user) {
        setSelectedUser((prevUser) => {
            const isSameRoom =
                (prevUser?.roomId && user?.roomId && prevUser.roomId === user.roomId) ||
                (prevUser?.id && user?.id && prevUser.id === user.id);

            if (isSameRoom) {
                return prevUser;
            }
            return user;
        });

        const targetId = user?.roomId || user?.targetUserId || user?.id;
        if (targetId && String(urlRoomId) !== String(targetId)) {
            navigate(`/c/${targetId}`);
        }

        // Trên mobile, chuyển sang view chatRoom
        if (isMobile && onSelectAndNavigate) {
            onSelectAndNavigate();
        }
    }

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await searchUsers(query);
                setSearchResults(results);
            } catch (error) {
                console.error("Lỗi khi tìm kiếm:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500);
    };

    const handleSelectSearchResult = (searchedUser) => {
        const existingRoom = users.find(u => u.targetUserId === searchedUser.id);
        if (existingRoom) {
            handleSelectUser(existingRoom);
        } else {
            const fakeRoom = {
                id: `temp-${searchedUser.id}`,
                roomId: null,
                targetUserId: searchedUser.id,
                targetUserName: searchedUser.userName,
                targetAvatarUrl: searchedUser.avatarUrl,
                isOnline: searchedUser.isOnline,
                lastMessage: "Chưa có tin nhắn",
                lastMessageTime: null,
                unreadCount: 0,
                messages: []
            };
            handleSelectUser(fakeRoom);
        }
        
        setSearchQuery("");
        setSearchResults([]);
    };

    const sortedUsers = [...users].sort((a, b) => {
        const aHasUnread = (a.unreadCount > 0) ? 1 : 0;
        const bHasUnread = (b.unreadCount > 0) ? 1 : 0;
        
        if (aHasUnread !== bHasUnread) {
            return bHasUnread - aHasUnread;
        }
        
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
    });   

      
    const priorityUsers = sortedUsers.filter(user => {   
        if (user.id > 0) return true;    
        if (user.friendshipStatus === "PENDING" && user.friendshipSenderId !== currentUser?.id) {
            return false;
        }        
        const hasRealRoom = sortedUsers.some(u => String(u.targetUserId) === String(user.targetUserId) && u.id > 0);
        if (hasRealRoom) {
            return false;
        }
        return true;
    });

    const friendRequests = sortedUsers.filter(user => 
        user.friendshipStatus === "PENDING" && 
        user.friendshipSenderId !== currentUser?.id && 
        user.id < 0
    );

    // Đồng ý kết bạn từ tab Lời mời
    const handleAcceptRequest = async (e, user) => {
        e.stopPropagation();
        try {
            const res = await api.post("/friendships/accept", null, {
                params: { senderId: user.friendshipSenderId }
            });
            if (res.data?.status === 200) {
                toast.success("Đã đồng ý kết bạn!");
            }
        } catch (error) {
            console.error("Lỗi đồng ý kết bạn:", error);
            toast.error("Đồng ý kết bạn thất bại!");
        }
    };

    // Từ chối kết bạn từ tab Lời mời
    const handleDeclineRequest = async (e, user) => {
        e.stopPropagation();
        try {
            const res = await api.post("/friendships/decline", null, {
                params: { senderId: user.friendshipSenderId }
            });
            if (res.data?.status === 200) {
                toast.success("Đã từ chối lời mời kết bạn!");
            }
        } catch (error) {
            console.error("Lỗi từ chối kết bạn:", error);
            toast.error("Từ chối kết bạn thất bại!");
        }
    };

    // Hàm mở dialog danh bạ kèm tăng refreshKey
    const openContactDialog = () => {
        setContactRefreshKey(k => k + 1);
        contactRef.current.open();
    };

    return (
        <>
            {/* 1. Menu Dialog chính (MỞ KHI ẤN AVATAR - Định vị ở góc trên, cạnh Avatar) */}
            <DialogWindow
                dialogForm={
                    <Menu 
                        userName={currentUser?.userName || name} 
                        email={currentUser?.email || email} 
                        avatarUrl={currentUser?.avatarUrl || avatarUrl || "/avatar.jpg"} 
                        openProfile={() => profileRef.current.open()}
                        openLogout={() => logoutRef.current.open()}
                        closeMenu={() => menuRef.current.close()}
                    />
                }
                ref={menuRef}
                position="top-[16px] left-[60px] m-0 p-0 bg-transparent border-none overflow-visible"
            />

            {/* 2. Menu Dialog Cài đặt (MỞ KHI ẤN ICON BÁNH RĂNG - Định vị ở góc dưới, ngay trên icon Bánh răng) */}
            <DialogWindow
                dialogForm={
                    <SettingsMenu 
                        openProfile={() => profileRef.current.open()}
                        openLogout={() => logoutRef.current.open()}
                        closeMenu={() => settingsMenuRef.current.close()}
                    />
                }
                ref={settingsMenuRef}
                position="fixed bottom-[0px] left-[60px] mt-88 p-0 bg-transparent border-none overflow-visible"
            />

            {/* Dialog Thông tin cá nhân */}
            <DialogWindow 
                dialogForm={
                    <Profile 
                        avatarUrl={currentUser?.avatarUrl || avatarUrl || "/avatar.jpg"} 
                        userName={currentUser?.userName || name} 
                        email={currentUser?.email || email} 
                        onClose={() => profileRef.current.close()} 
                    />
                } 
                ref={profileRef} 
                position={`m-auto p-0 bg-transparent border-none text-gray-800 rounded-2xl w-[400px] max-w-[90vw] shadow-2xl`} 
            />

            {/* Dialog Xác nhận đăng xuất */}
            <DialogWindow 
                dialogForm={
                    <ConfirmLogout 
                        cancleLogout={() => logoutRef.current.close()} 
                    />
                } 
                ref={logoutRef} 
                position={`m-auto`}
            />
                        {/* Dialog Danh bạ bạn bè */}
            <DialogWindow 
                dialogForm={
                    <ContactDialog 
                        refreshKey={contactRefreshKey}
                        onClose={() => contactRef.current.close()} 
                    />
                } 
                ref={contactRef} 
                position={`m-auto p-0 bg-transparent border-none text-gray-800 rounded-2xl w-[450px] max-w-[90vw] shadow-2xl`} 
            />

            {/* Dialog Tạo nhóm */}
            <DialogWindow 
                dialogForm={
                    <CreateGroupDialog 
                        onClose={() => createGroupRef.current.close()} 
                    />
                } 
                ref={createGroupRef} 
                position={`m-auto p-0 bg-transparent border-none text-gray-800 rounded-2xl w-[480px] max-w-[90vw] shadow-2xl`} 
            />
            {/* Bố cục cấu trúc chia đôi */}
            <div className={`flex bg-white p-0 border-r border-gray-200 h-screen overflow-hidden select-none ${isMobile ? 'w-full' : isTablet ? 'w-[40%] min-w-[280px] max-w-[360px]' : 'w-98'}`}>
                
                {/* 1. THANH DỌC MÀU XANH (Left-most Blue Sidebar) — Ẩn trên mobile */}
                {!isMobile && (
                <div className="w-14 bg-[#0068ff] flex flex-col items-center justify-between py-4 text-white flex-shrink-0 z-10 shadow-md">
                    {/* Phần trên */}
                    <div className="flex flex-col items-center w-full">
                        {/* Click Avatar -> Mở menu góc trên */}
                        <div className="relative group cursor-pointer mb-6" onClick={handleClick}>
                            <img
                                src={currentUser?.avatarUrl || avatarUrl || "/avatar.jpg"}
                                alt={currentUser?.userName || name}
                                className="w-11 h-11 rounded-full border-2 border-white/30 object-cover hover:border-white hover:scale-105 transition-all duration-200"
                            />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-[#0068ff] rounded-full"></div>
                        </div>

                        <div className="flex flex-col items-center gap-1 w-full ">
                            <button className="cursor-pointer relative p-3 w-full flex justify-center text-white bg-black/15 hover:bg-white/20 transition-all duration-200">
                                <MessageSquare className="w-5.5 h-5.5" />
                                { sortedUsers.reduce((sum, u) => sum + (u.unreadCount || 0), 0) > 0 &&
                                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#0068ff] shadow-sm leading-none">
                                    {sortedUsers.reduce((sum, u) => sum + (u.unreadCount || 0), 0)}
                                </span>
                                }   
                            </button>
                            <button onClick={openContactDialog} className="cursor-pointer p-3 w-full flex justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200" title="Danh bạ">
                                <Contact className="w-5.5 h-5.5" />
                            </button>
                        </div>
                    </div>

                    {/* Phần dưới */}
                    <div className="flex flex-col items-center gap-1 w-full">
                       
                        {/* Click Bánh răng -> Mở menu cài đặt góc dưới */}
                        <button onClick={handleSettingsClick} className=" w-full flex justify-center text-white/70 hover:text-white cursor-pointer transition-all duration-200 mt-4 border-t border-white/10 pt-4" title="Cài đặt">
                            <Settings className="w-7 h-7" />
                        </button>
                    </div>
                </div>
                )}

                {/* 2. KHU VỰC TÌM KIẾM & DANH SÁCH CHAT */}
                <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
                    <div className="p-3 flex items-center gap-2">
                        {isMobile && (
                            <div className="relative group cursor-pointer shrink-0" onClick={handleClick}>
                                <img
                                    src={currentUser?.avatarUrl || avatarUrl || "/avatar.jpg"}
                                    alt={currentUser?.userName || name}
                                    className="w-9 h-9 rounded-full border border-gray-200 object-cover"
                                />
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                        )}
                        <div className="flex-1 flex items-center bg-gray-100 focus-within:bg-white border border-transparent focus-within:border-blue-500 px-2 py-1.5 rounded-md gap-1 transition-all">
                            <Search className="text-gray-400 w-4 h-4 ms-1" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="outline-none w-full text-xs font-medium bg-transparent text-gray-700 placeholder:text-gray-400"
                                placeholder="Tìm kiếm"
                            />
                        </div>
                        <button
                         onClick={openContactDialog}
                         className="cursor-pointer p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700" title="Thêm bạn">
                            <UserPlus className="w-4.5 h-4.5" />
                        </button>
                        <button
                            onClick={() => createGroupRef.current.open()}
                            className="cursor-pointer p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700 relative"
                            title="Tạo nhóm"
                        >
                            <Users2 className="w-4.5 h-4.5" />
                            <span className="absolute top-[6px] left-[21px] text-gray-500 text-[13px] rounded-full font-bold leading-none">
                                +
                            </span>
                        </button>
                    </div>

                                        <div className="px-3 pb-2 flex items-center justify-between border-b border-gray-200">
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <button 
                                onClick={() => setActiveTab("ưu-tiên")} 
                                className={`pb-1.5 relative transition-colors ${activeTab === "ưu-tiên" ? "text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                Ưu tiên
                                {activeTab === "ưu-tiên" && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
                                )}
                            </button>
                            <button 
                                onClick={() => setActiveTab("lời-mời")} 
                                className={`pb-1.5 relative transition-colors flex items-center gap-1 ${activeTab === "lời-mời" ? "text-blue-600 font-bold" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                Lời mời
                                {friendRequests.length > 0 && (
                                    <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none animate-pulse">
                                        {friendRequests.length}
                                    </span>
                                )}
                                {activeTab === "lời-mời" && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
                            <button className="p-0.5 hover:bg-gray-100 rounded-md transition-colors">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className={`flex-1 overflow-y-auto p-1 ${isMobile ? 'pb-16' : ''}`}>
                        {searchQuery.trim() ? (
                            <UnifiedSearchResults 
                                isSearching={isSearching}
                                localMatchedRooms={users.filter(room => {
                                    const nameToCompare = room.isGroup 
                                        ? (room.roomName || "Nhóm chat") 
                                        : (room.targetUserName || "User");
                                    return nameToCompare.toLowerCase().includes(searchQuery.trim().toLowerCase());
                                })}
                                globalUsers={searchResults}
                                onSelectRoom={handleSelectUser}
                                onSelectGlobalUser={handleSelectSearchResult}
                                currentUserId={currentUser?.id}
                                typingUsersMap={typingUsersMap}
                            />
                        ) : activeTab === "ưu-tiên" ? (
                            <PriorityRoomList 
                                priorityUsers={priorityUsers} 
                                currentUser={currentUser} 
                                selectedUser={selectedUser} 
                                onSelectUser={handleSelectUser} 
                                typingUsersMap={typingUsersMap}
                            />
                        ) : (
                            <FriendRequestList 
                                friendRequests={friendRequests} 
                                onAccept={handleAcceptRequest} 
                                onDecline={handleDeclineRequest} 
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}



function UnifiedSearchResults({ isSearching, localMatchedRooms, globalUsers, onSelectRoom, onSelectGlobalUser, currentUserId, typingUsersMap }) {
    // Loại bỏ những user global đã có trong localMatchedRooms để tránh hiển thị trùng lặp
    const localUserIds = new Set(
        localMatchedRooms
            .filter(r => !r.isGroup)
            .map(r => String(r.targetUserId))
    );
    const filteredGlobalUsers = globalUsers.filter(u => !localUserIds.has(String(u.id)));

    const hasLocal = localMatchedRooms.length > 0;
    const hasGlobal = filteredGlobalUsers.length > 0;

    if (isSearching && !hasLocal && !hasGlobal) {
        return <DashRing className="w-6 h-6 mx-auto my-6 text-blue-400 animate-spin" />;
    }

    if (!hasLocal && !hasGlobal) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 gap-2 mt-8 bg-gray-50/50 rounded-2xl mx-2">
                <Search className="w-8 h-8 text-gray-300 stroke-[1.5]" />
                <p className="text-xs font-semibold">Không tìm thấy kết quả phù hợp</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-200">
            {/* PHẦN 1: CÁC CUỘC TRÒ CHUYỆN VÀ NHÓM CHAT HIỆN CÓ */}
            {hasLocal && (
                <div className="flex flex-col">
                    <div className="px-3.5 py-2 text-[10px] font-bold text-gray-400 uppercase bg-gray-50/60 tracking-wider select-none">
                        Trò chuyện & Nhóm ({localMatchedRooms.length})
                    </div>
                    {localMatchedRooms.map((room, index) => (
                        <ItemUser
                            key={room.id ?? room.roomId ?? index}
                            user={room}
                            currentUserId={currentUserId}
                            currentUserName="Bạn"
                            targetUserName={room.targetUserName || "User"}
                            onSelect={onSelectRoom}
                            isActive={false}
                            typingUsers={(typingUsersMap[room.roomId] ?? []).filter(
                                u => String(u.userId) !== String(currentUserId)
                            )}
                        />
                    ))}
                </div>
            )}

            {/* PHẦN 2: TÌM KIẾM NGƯỜI DÙNG MỚI TRÊN HỆ THỐNG */}
            {hasGlobal && (
                <div className="flex flex-col mt-2">
                    <div className="px-3.5 py-2 text-[10px] font-bold text-gray-400 uppercase bg-gray-50/60 tracking-wider select-none border-t border-gray-100/50 pt-3">
                        Người dùng mới trên hệ thống ({filteredGlobalUsers.length})
                    </div>
                    {filteredGlobalUsers.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => onSelectGlobalUser(user)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all bg-white hover:bg-gray-50/80 border-b border-gray-50/50 group"
                        >
                            <img 
                                src={user.avatarUrl || "/avatar.jpg"} 
                                alt={user.userName} 
                                className="w-10 h-10 rounded-full object-cover border border-gray-200/80 shadow-2xs group-hover:scale-102 transition-transform" 
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-800 truncate leading-snug">{user.userName}</h3>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                Kết nối
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {isSearching && (
                <div className="flex justify-center py-4 shrink-0">
                    <DashRing className="w-5 h-5 text-blue-400" />
                </div>
            )}
        </div>
    );
}

function PriorityRoomList({ priorityUsers, currentUser, selectedUser, onSelectUser, typingUsersMap }) {
    if (priorityUsers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 h-full gap-2 bg-gray-50/50 mt-10 rounded-2xl mx-2">
                <MessageSquare className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                <p className="text-xs font-medium">Chưa có hội thoại nào</p>
            </div>
        );
    }
    return priorityUsers.map((user, index) => (
        <ItemUser
            key={user.id ?? user.roomId ?? index}
            user={user}
            currentUserId={currentUser?.id}
            currentUserName={currentUser?.userName || "Bạn"}
            targetUserName={user.targetUserName || "User"}
            onSelect={onSelectUser}
            isActive={
                (selectedUser?.roomId && user.roomId && selectedUser.roomId === user.roomId) ||
                (selectedUser?.id && user.id && selectedUser.id === user.id)
            }
            typingUsers={(typingUsersMap[user.roomId] ?? []).filter(
                u => String(u.userId) !== String(currentUser?.id)
            )}
        />
    ));
}

function FriendRequestList({ friendRequests, onAccept, onDecline }) {
    if (friendRequests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 h-full gap-2 bg-gray-50/50 mt-10 rounded-2xl mx-2">
                <UserPlus className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                <p className="text-xs font-medium">Chưa có lời mời kết bạn nào</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col py-2">
            {friendRequests.map((user, index) => (
                <div key={user.id ?? index} className="flex flex-col p-3.5 rounded-2xl transition-all duration-200 bg-blue-50/30 hover:bg-blue-50/60 border border-blue-100/50 my-1.5 mx-3 shadow-xs hover:shadow-sm gap-3">
                    <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                            <img src={user.targetAvatarUrl || "/avatar.jpg"} alt={user.targetUserName} className="w-12 h-12 rounded-full object-cover border-2 border-white bg-white shadow-xs ring-1 ring-blue-100/80" />
                            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.isOnline ? "bg-green-500" : "bg-gray-400"}`}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 break-words whitespace-normal leading-tight">{user.targetUserName || "Chưa có tên"}</h3>
                            <p className="text-[11px] text-blue-600 font-semibold mt-1 break-words whitespace-normal leading-relaxed">{user.targetUserName || "Chưa có tên"} đã gửi lời kết bạn với bạn</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <button onClick={(e) => onAccept(e, user)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer text-center">Chấp nhận</button>
                        <button onClick={(e) => onDecline(e, user)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 hover:text-red-600 active:scale-[0.97] text-gray-600 text-xs font-bold rounded-xl transition-all border border-gray-200 cursor-pointer text-center">Từ chối</button>
                    </div>
                </div>
            ))}
        </div>
    );
}