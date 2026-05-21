import { Search, UserPlus, Users2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ItemUser from "./ItemUser";
import DialogWindow from "./dialog/DialogWindow";

import { useChat } from "../../hooks/useChat";
import { useChatSocket } from "../../hooks/useChatSocket";
import api from '../../api/axiosConfig';
import { searchUsers } from "../../services/userService";
import { useNavigate, useParams } from "react-router-dom";
import Menu from "./dialog/Menu";
import Profile from "./dialog/Profile";
import ConfirmLogout from "./dialog/ConfirmLogout";
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOpponentNameFromRoomName(roomName, currentUserName) {
    if (!roomName) {
        return null;
    }

    if (!currentUserName) {
        return roomName;
    }

    const separators = [",", " - ", "-", " & ", "&", " / ", "/"];

    for (const separator of separators) {
        if (!roomName.includes(separator)) {
            continue;
        }

        const parts = roomName
            .split(separator)
            .map((part) => part.trim())
            .filter(Boolean);

        if (parts.length < 2) {
            continue;
        }

        const opponent = parts.find((part) => part.toLowerCase() !== currentUserName.toLowerCase());
        if (opponent) {
            return opponent;
        }
    }

    const strippedRoomName = roomName
        .replace(new RegExp(`^${escapeRegExp(currentUserName)}\\s*[,\\-/&]*\\s*`, "i"), "")
        .replace(new RegExp(`\\s*[,\\-/&]*\\s*${escapeRegExp(currentUserName)}$`, "i"), "")
        .trim();

    return strippedRoomName || roomName;
}

function normalizeChatRoom(rawRoom, currentUserId, currentUserName) {
    const nestedUser =
        rawRoom?.user ??
        rawRoom?.receiver ??
        rawRoom?.targetUser ??
        rawRoom?.otherUser ??
        rawRoom?.participant ??
        rawRoom?.members?.find((member) => member?.id !== currentUserId) ??
        rawRoom?.participants?.find((member) => member?.id !== currentUserId) ??
        {};

    const roomId = rawRoom?.roomId ?? rawRoom?.chatRoomId ?? rawRoom?.id ?? rawRoom?.room?.id ?? null;
    const targetUserId =
        rawRoom?.targetUserId ??
        rawRoom?.otherUserId ??
        rawRoom?.participantId ??
        rawRoom?.userId ??
        rawRoom?.receiverId ??
        rawRoom?.user?.id ??
        rawRoom?.receiver?.id ??
        rawRoom?.targetUser?.id ??
        rawRoom?.otherUser?.id ??
        nestedUser?.id ??
        null;
    const targetUserEmail = 
        nestedUser?.email ??
        rawRoom?.targetUserEmail ??
        rawRoom?.user?.email ??
        rawRoom?.receiver?.email ??
        rawRoom?.otherUser?.email ??
        rawRoom?.email ??
        null;
    const lastMessageObject = rawRoom?.lastMessage;
    const resolvedOpponentName = getOpponentNameFromRoomName(
        rawRoom?.roomName ?? rawRoom?.name ?? rawRoom?.userName,
        currentUserName
    );

    return {
        ...rawRoom,
        targetUserId,
        targetUserEmail,
        roomId,
        targetUserName:
            nestedUser?.userName ??
            nestedUser?.name ??
            rawRoom?.receiverName ??
            rawRoom?.otherUserName ??
            rawRoom?.targetUserName ??
            resolvedOpponentName ??
            rawRoom?.userName ??
            rawRoom?.name ??
            "User",
        avatarUrl:
            rawRoom?.targetAvatarUrl ??
            rawRoom?.avatarUrl ??
            rawRoom?.userAvatar ??
            rawRoom?.receiverAvatar ??
            rawRoom?.roomAvatar ??
            nestedUser?.avatarUrl ??
            nestedUser?.userAvatar ??
            "/avatar.jpg",
        targetAvatarUrl:
            rawRoom?.targetAvatarUrl ??
            rawRoom?.avatarUrl ??
            rawRoom?.userAvatar ??
            rawRoom?.receiverAvatar ??
            rawRoom?.roomAvatar ??
            nestedUser?.avatarUrl ??
            nestedUser?.userAvatar ??
            "/avatar.jpg",
        lastMessage:
            rawRoom?.lastMessageContent ??
            lastMessageObject?.content ??
            (typeof lastMessageObject === "string" ? lastMessageObject : null) ??
            rawRoom?.content ??
            "Chua co tin nhan",
        lastMessageTime: 
            rawRoom?.lastMessageTime ??
            lastMessageObject?.createdAt ??
            rawRoom?.lastMessageCreatedAt ??
            rawRoom?.createdAt ??
            null,
        lastMessageSenderId:
            rawRoom?.lastMessageSenderId ??
            lastMessageObject?.senderId ??
            rawRoom?.lastMessageSenderId ??
            null,
        isLastMessageSeen: rawRoom?.isLastMessageSeen ?? false,
        unreadCount: rawRoom?.unreadCount ?? 0,
        isOnline: nestedUser?.isOnline ?? rawRoom?.isOnline ?? false,
        messages: Array.isArray(rawRoom?.messages) ? rawRoom.messages : [],
    };
}



export default function LeftSidebar({ avatarUrl, name, email }) {
 
    const menuRef = useRef();
    const profileRef = useRef();
    const logoutRef = useRef();
    const { selectedUser, setSelectedUser, currentUser, updateUserStatus } = useChat();
    const { subscribe, publish, isConnected } = useChatSocket();
    const [users, setUsers] = useState([]);
    const prevSelectedRoomIdRef = useRef(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef(null);

    const navigate = useNavigate();
    const { roomId: urlRoomId } = useParams();

    // Effect to auto-select room from URL when users list is loaded
    useEffect(() => {
        if (users.length > 0 && urlRoomId) {
            const roomToSelect = users.find(u => 
                String(u.roomId) === String(urlRoomId) || 
                String(u.targetUserId) === String(urlRoomId) || 
                String(u.id) === String(urlRoomId)
            );
            
            if (roomToSelect) {
                const isCurrentlySelected = 
                    (selectedUser?.roomId === roomToSelect.roomId && roomToSelect.roomId) || 
                    (selectedUser?.id === roomToSelect.id);
                    
                if (!isCurrentlySelected) {
                    setSelectedUser(roomToSelect);
                }
            } else {
                // If it's not in the list, but it's a URL, we might want to fetch it, 
                // but for now we just try to select if it exists.
            }
        }
    }, [users, urlRoomId, selectedUser, setSelectedUser]);

    function handleClick() {
        menuRef.current.open();
        }

    // Cập nhật danh sách users khi selectedUser thay đổi (lastMessage hoặc lastMessageTime)
    useEffect(() => {
        if (!selectedUser) return;

        setUsers(prevUsers =>
            prevUsers.map(user =>
                (user.roomId === selectedUser.roomId || user.id === selectedUser.id || user.targetUserId === selectedUser.id || user.targetUserId === selectedUser.targetUserId)
                    ? {
                        ...user,
                        lastMessage: selectedUser.lastMessage ?? user.lastMessage,
                        lastMessageTime: selectedUser.lastMessageTime ?? user.lastMessageTime,
                        lastMessageSenderId: selectedUser.lastMessageSenderId ?? user.lastMessageSenderId,
                    }
                    : user
            )
        );
    }, [selectedUser?.lastMessage, selectedUser?.lastMessageTime, selectedUser?.lastMessageSenderId, selectedUser?.isLastMessageSeen, selectedUser?.id, selectedUser?.roomId]);

    // Handle Enter/Leave Room for WebSocket
    useEffect(() => {
        const roomId = selectedUser?.roomId || selectedUser?.id;
        let interval;
        if (isConnected && currentUser?.id) {
            if (prevSelectedRoomIdRef.current && prevSelectedRoomIdRef.current !== roomId) {
                publish("/app/room/leave", { userId: currentUser.id, roomId: prevSelectedRoomIdRef.current });
            }
            if (roomId) {
                publish("/app/room/enter", { userId: currentUser.id, roomId });
                // Reset unread count locally when entering
                setUsers(prevUsers => prevUsers.map(user => 
                    (user.roomId === roomId || user.id === roomId) 
                        ? { ...user, unreadCount: 0 } 
                        : user
                ));

                // Heartbeat to keep activeRoom TTL alive in Redis (expires in 60s)
                interval = setInterval(() => {
                    publish("/app/room/enter", { userId: currentUser.id, roomId });
                }, 45000);
            }
            prevSelectedRoomIdRef.current = roomId;
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [selectedUser?.roomId, selectedUser?.id, isConnected, currentUser?.id, publish]);

    useEffect(() => {
        return () => {
            if (prevSelectedRoomIdRef.current && currentUser?.id && isConnected) {
                publish("/app/room/leave", { userId: currentUser.id, roomId: prevSelectedRoomIdRef.current });
            }
        };
    }, [currentUser?.id, isConnected, publish]);

     // Subscribe vào user-status topic để nhận update online/offline
    useEffect(() => {
        if (!isConnected) return;
       
        const subscription = subscribe('/topic/user-status', (message) => {
            try {
                const data = typeof message === 'string' ? JSON.parse(message) : message;
                console.log('User status updated:', data);
                // Cập nhật trạng thái vào context
                updateUserStatus(data.email.toLowerCase(), data.isOnline, data.userId);
                
                // Cập nhật selectedUser nếu đang chat với người này
                setSelectedUser(prevSelected => {
                    if (prevSelected && (
                        String(prevSelected.targetUserId) === String(data.userId) ||
                        String(prevSelected.id) === String(data.userId) ||
                        prevSelected.email?.toLowerCase() === data.email.toLowerCase() ||
                        prevSelected.targetUserEmail?.toLowerCase() === data.email.toLowerCase()
                    )) {
                        return { ...prevSelected, isOnline: data.isOnline };
                    }
                    return prevSelected;
                });

                // Cập nhật lại danh sách users
                setUsers(prevUsers =>
                    prevUsers.map(user =>
                        String(user.targetUserId) === String(data.userId) || 
                        String(user.id) === String(data.userId) ||
                        user.email?.toLowerCase() === data.email.toLowerCase() || 
                        user.targetUserEmail?.toLowerCase() === data.email.toLowerCase()
                            ? { ...user, isOnline: data.isOnline }
                            : user
                    )
                );
            } catch (error) {
                console.error('Error parsing user status message:', error);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [isConnected, subscribe, updateUserStatus]);

    // Subscribe vào topic cập nhật thông tin phòng (có tin nhắn mới, cập nhật unreadCount)
    useEffect(() => {
        if (!currentUser?.id || !isConnected) return;
        
        const roomUpdateSub = subscribe(`/topic/user/${currentUser.id}/rooms`, (message) => {
            try {
                const updatedRoom = typeof message === 'string' ? JSON.parse(message) : message;
                const normalizedRoom = normalizeChatRoom(updatedRoom, currentUser.id, currentUser.userName);
                
                setUsers(prevUsers => {
                    // Cập nhật room có sẵn hoặc thêm room mới lên đầu
                    const index = prevUsers.findIndex(u => u.roomId === normalizedRoom.roomId || u.id === normalizedRoom.id);
                    let newUsers = [...prevUsers];
                    if (index !== -1) {
                        newUsers[index] = { ...newUsers[index], ...normalizedRoom };
                        // Đưa room vừa có tin nhắn lên đầu
                        const updated = newUsers.splice(index, 1)[0];
                        newUsers.unshift(updated);
                    } else {
                        newUsers.unshift(normalizedRoom);
                    }
                    return newUsers;
                });
            } catch (e) {
                console.error("Error parsing room update:", e);
            }
        });

        return () => {
            roomUpdateSub?.unsubscribe();
        };
    }, [isConnected, subscribe, currentUser?.id]);

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

        // Push URL to reflect the selected room
        const targetId = user?.roomId || user?.targetUserId || user?.id;
        if (targetId && String(urlRoomId) !== String(targetId)) {
            navigate(`/c/${targetId}`);
        }
    }

    // Handle search input with debounce
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
        }, 500); // 500ms debounce
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
        
        // Clear search after selecting
        setSearchQuery("");
        setSearchResults([]);
    };

    useEffect(() => {
        // if (!currentUser?.id) {
        //     setUsers([]);
        //     return;
        // }

        api.get(`/chat-rooms/user/${currentUser?.id}`)
            .then(res => {
                console.log(res.data);
                const normalizedRooms = Array.isArray(res.data?.data)
                    ? res.data.data.map((room) => normalizeChatRoom(room, currentUser.id, currentUser.userName))
                    : [];
                    console.log("Normalized rooms:", normalizedRooms);
                setUsers(normalizedRooms);
            })
            .catch((error) => {
                console.error(error.response?.data ?? error);
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                }
            });
    }, [currentUser?.id]);

    const sortedUsers = [...users].sort((a, b) => {
        const aHasUnread = (a.unreadCount > 0) ? 1 : 0;
        const bHasUnread = (b.unreadCount > 0) ? 1 : 0;
        
        if (aHasUnread !== bHasUnread) {
            return bHasUnread - aHasUnread; // Ưu tiên chưa đọc lên trước
        }
        
        // Nếu cùng trạng thái đọc -> Sắp xếp theo thời gian tin nhắn mới nhất
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
    });   

    return (
        <>
            {/* Menu Dialog chính */}
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
                position="ms-20"
            />

            {/* Dialog Thông tin cá nhân (Đồng cấp) */}
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

            {/* Dialog Xác nhận đăng xuất (Đồng cấp) */}
            <DialogWindow 
                dialogForm={
                    <ConfirmLogout 
                        cancleLogout={() => logoutRef.current.close()} 
                    />
                } 
                ref={logoutRef} 
                position={`m-auto`}
            />
            <div className="flex flex-col w-92 bg-white p-0 gap-2 border-r border-gray-200 h-screen">
                <div className="flex bg-white-100 p-3 justify-start items-center gap-3 border-b border-gray-300">
                    <img
                        onClick={handleClick}
                        src={currentUser?.avatarUrl || avatarUrl || "/avatar.jpg"}
                        alt={currentUser?.userName || name}
                        className="cursor-pointer w-15 h-15 border-blue-700 border-4 hover:border transition-ease-in-out duration-300 rounded-full object-cover"
                    />
                    <div className="focus-within:ring-2 focus-within:ring-blue-500 flex items-center bg-gray-200 p-1 rounded-md gap-1">
                        <Search className="text-gray-400 ms-1" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="outline-none w-full text-sm font-medium h-8 p-2 bg-gray-200 rounded-md text-gray-500 placeholder:text-gray-400"
                            placeholder="Tên hoặc email"
                        />
                    </div>
                    <UserPlus className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                    <Users2 className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                </div>
                <div className="overflow-y-auto">
                    {searchQuery.trim() ? (
                        isSearching ? (
                            <div className="p-4 text-center text-sm text-gray-500">Đang tìm kiếm...</div>
                        ) : searchResults.length > 0 ? (
                            <>
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Kết quả tìm kiếm</div>
                                {searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleSelectSearchResult(user)}
                                        className="w-full flex items-center gap-4 p-2 rounded-md cursor-pointer transition-colors bg-white hover:bg-gray-100"
                                    >
                                        <img src={user.avatarUrl || "/avatar.jpg"} alt={user.userName} className="w-12 h-12 rounded-full object-cover border border-gray-300" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">{user.userName}</h3>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">Không tìm thấy ai</div>
                        )
                    ) : (
                        sortedUsers.map((user, index) => (
                            <ItemUser
                                key={user.id ?? user.roomId ?? index}
                                user={user}
                                currentUserId={currentUser?.id}
                                currentUserName={currentUser?.userName || "Bạn"}
                                targetUserName={user.targetUserName || "User"}
                                onSelect={handleSelectUser}
                                isActive={
                                    (selectedUser?.roomId && user.roomId && selectedUser.roomId === user.roomId) ||
                                    (selectedUser?.id && user.id && selectedUser.id === user.id)
                                }
                            />
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
