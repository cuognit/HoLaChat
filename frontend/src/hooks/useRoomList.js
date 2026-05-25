import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from '../api/axiosConfig';

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOpponentNameFromRoomName(roomName, currentUserName) {
    if (!roomName) return null;
    if (!currentUserName) return roomName;

    const separators = [",", " - ", "-", " & ", "&", " / ", "/"];
    for (const separator of separators) {
        if (!roomName.includes(separator)) continue;
        const parts = roomName.split(separator).map(part => part.trim()).filter(Boolean);
        if (parts.length < 2) continue;
        const opponent = parts.find(part => part.toLowerCase() !== currentUserName.toLowerCase());
        if (opponent) return opponent;
    }

    return roomName
        .replace(new RegExp(`^${escapeRegExp(currentUserName)}\\s*[,\\-/&]*\\s*`, "i"), "")
        .replace(new RegExp(`\\s*[,\\-/&]*\\s*${escapeRegExp(currentUserName)}$`, "i"), "")
        .trim() || roomName;
}

export function normalizeChatRoom(rawRoom, currentUserId, currentUserName) {
    const nestedUser = rawRoom?.user ?? rawRoom?.targetUser ?? rawRoom?.receiver ?? rawRoom?.otherUser ?? 
        rawRoom?.members?.find((member) => member?.id !== currentUserId) ?? {};

    const roomId = rawRoom?.roomId ?? rawRoom?.chatRoomId ?? (typeof rawRoom?.id === 'number' && rawRoom.id > 0 ? rawRoom.id : null) ?? rawRoom?.room?.id ?? null;
    const targetUserId = rawRoom?.targetUserId ?? rawRoom?.otherUserId ?? rawRoom?.userId ?? nestedUser?.id ?? null;
    const targetUserEmail = rawRoom?.targetUserEmail ?? nestedUser?.email ?? rawRoom?.email ?? null;

    const resolvedOpponentName = getOpponentNameFromRoomName(rawRoom?.roomName ?? rawRoom?.userName, currentUserName);
    const targetUserName = nestedUser?.userName ?? rawRoom?.targetUserName ?? resolvedOpponentName ?? rawRoom?.userName ?? "User";
    const avatarUrl = rawRoom?.targetAvatarUrl ?? rawRoom?.avatarUrl ?? nestedUser?.avatarUrl ?? "/avatar.jpg";
    const lastMessageObject = rawRoom?.lastMessage;

    return {
        ...rawRoom,
        roomId,
        targetUserId,
        targetUserEmail,
        targetUserName,
        avatarUrl,
        targetAvatarUrl: avatarUrl,
        lastMessage: rawRoom?.lastMessageContent ?? lastMessageObject?.content ?? (typeof lastMessageObject === "string" ? lastMessageObject : null) ?? rawRoom?.content ?? "Chưa có tin nhắn",
        lastMessageTime: rawRoom?.lastMessageTime ?? lastMessageObject?.createdAt ?? rawRoom?.createdAt ?? null,
        lastMessageSenderId: rawRoom?.lastMessageSenderId ?? lastMessageObject?.senderId ?? null,
        isLastMessageSeen: rawRoom?.isLastMessageSeen ?? false,
        unreadCount: rawRoom?.unreadCount ?? 0,
        isOnline: nestedUser?.isOnline ?? rawRoom?.isOnline ?? false,
        friendshipStatus: rawRoom?.friendshipStatus ?? null,
        friendshipSenderId: rawRoom?.friendshipSenderId ?? null,
        messages: Array.isArray(rawRoom?.messages) ? rawRoom.messages : [],
    };
}

export function useRoomList(currentUser, selectedUser, setSelectedUser, updateUserStatus, isConnected, subscribe, publish) {
    const [users, setUsers] = useState([]);
    const prevSelectedRoomIdRef = useRef(null);
    const { roomId: urlRoomId } = useParams();
    const navigate = useNavigate();

    // 1. Tự động chọn phòng từ URL
    useEffect(() => {
        if (users.length > 0 && urlRoomId) {
            const roomToSelect = users.find(u => 
                String(u.roomId) === String(urlRoomId) || 
                String(u.targetUserId) === String(urlRoomId) || 
                String(u.id) === String(urlRoomId)
            );
            if (roomToSelect) {
                const isCurrentlySelected = (selectedUser?.roomId === roomToSelect.roomId && roomToSelect.roomId) || (selectedUser?.id === roomToSelect.id);
                if (!isCurrentlySelected) {
                    setSelectedUser(roomToSelect);
                }
            }
        }
    }, [users, urlRoomId, selectedUser, setSelectedUser]);

    // 2. Fetch danh sách phòng ban đầu
    useEffect(() => {
        if (!currentUser?.id) return;
        api.get(`/chat-rooms/user/${currentUser.id}`)
            .then(res => {
                const normalizedRooms = Array.isArray(res.data?.data)
                    ? res.data.data.map((room) => normalizeChatRoom(room, currentUser.id, currentUser.userName))
                    : [];
                setUsers(normalizedRooms);
            })
            .catch((error) => {
                if (error.response?.status === 401) localStorage.removeItem('token');
            });
    }, [currentUser?.id]);

    // 3. Cập nhật thông tin khi selectedUser thay đổi
    useEffect(() => {
        if (!selectedUser) return;
        setUsers(prevUsers => prevUsers.map(user =>
            (user.roomId === selectedUser.roomId || user.id === selectedUser.id || user.targetUserId === selectedUser.id || user.targetUserId === selectedUser.targetUserId)
                ? {
                    ...user,
                    lastMessage: selectedUser.lastMessage ?? user.lastMessage,
                    lastMessageTime: selectedUser.lastMessageTime ?? user.lastMessageTime,
                    lastMessageSenderId: selectedUser.lastMessageSenderId ?? user.lastMessageSenderId,
                } : user
        ));
    }, [selectedUser?.lastMessage, selectedUser?.lastMessageTime, selectedUser?.lastMessageSenderId, selectedUser?.isLastMessageSeen, selectedUser?.id, selectedUser?.roomId]);

    // 4. Quản lý WebSocket phòng chat (Enter/Leave)
    useEffect(() => {
        const roomId = selectedUser?.roomId || selectedUser?.id;
        let interval;
        if (isConnected && currentUser?.id) {
            if (prevSelectedRoomIdRef.current && prevSelectedRoomIdRef.current !== roomId) {
                publish("/app/room/leave", { userId: currentUser.id, roomId: prevSelectedRoomIdRef.current });
            }
            if (roomId) {
                publish("/app/room/enter", { userId: currentUser.id, roomId });
                setUsers(prevUsers => prevUsers.map(user => 
                    (user.roomId === roomId || user.id === roomId) ? { ...user, unreadCount: 0 } : user
                ));
                interval = setInterval(() => publish("/app/room/enter", { userId: currentUser.id, roomId }), 45000);
            }
            prevSelectedRoomIdRef.current = roomId;
        }
        return () => { if (interval) clearInterval(interval); };
    }, [selectedUser?.roomId, selectedUser?.id, isConnected, currentUser?.id, publish]);

    useEffect(() => {
        return () => {
            if (prevSelectedRoomIdRef.current && currentUser?.id && isConnected) {
                publish("/app/room/leave", { userId: currentUser.id, roomId: prevSelectedRoomIdRef.current });
            }
        };
    }, [currentUser?.id, isConnected, publish]);

    // 5. Trạng thái online/offline
    useEffect(() => {
        if (!isConnected) return;
        const subscription = subscribe('/topic/user-status', (message) => {
            try {
                const data = typeof message === 'string' ? JSON.parse(message) : message;
                updateUserStatus(data.email.toLowerCase(), data.isOnline, data.userId);
                
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

                setUsers(prevUsers => prevUsers.map(user =>
                    String(user.targetUserId) === String(data.userId) || 
                    String(user.id) === String(data.userId) ||
                    user.email?.toLowerCase() === data.email.toLowerCase() || 
                    user.targetUserEmail?.toLowerCase() === data.email.toLowerCase()
                        ? { ...user, isOnline: data.isOnline } : user
                ));
            } catch (error) {
                console.error('Error parsing user status message:', error);
            }
        });
        return () => subscription?.unsubscribe();
    }, [isConnected, subscribe, updateUserStatus]);

    // 6. Tin nhắn mới / Unread count
    useEffect(() => {
        if (!currentUser?.id || !isConnected) return;
        const roomUpdateSub = subscribe(`/topic/user/${currentUser.id}/rooms`, (message) => {
            try {
                const updatedRoom = typeof message === 'string' ? JSON.parse(message) : message;
                
                if (updatedRoom.friendshipStatus === "DELETED") {
                    setUsers(prevUsers => prevUsers.filter(u => String(u.id) !== String(updatedRoom.id)));
                    return;
                }

                const normalizedRoom = normalizeChatRoom(updatedRoom, currentUser.id, currentUser.userName);
                
                setSelectedUser(prevSelected => {
                    // KHÔNG đè lên selectedUser nếu incoming là lời mời kết bạn (id âm)
                    if (normalizedRoom.id < 0) return prevSelected;
                    if (prevSelected && (
                        String(prevSelected.id) === String(normalizedRoom.id) ||
                        (prevSelected.roomId && normalizedRoom.roomId && String(prevSelected.roomId) === String(normalizedRoom.roomId)) ||
                        (prevSelected.targetUserId && normalizedRoom.targetUserId && String(prevSelected.targetUserId) === String(normalizedRoom.targetUserId))
                    )) {
                        const finalRoomId = (typeof normalizedRoom.roomId === 'number' && normalizedRoom.roomId > 0)
                            ? normalizedRoom.roomId : (prevSelected.roomId || null);
                        return { ...prevSelected, ...normalizedRoom, roomId: finalRoomId, messages: prevSelected.messages };
                    }
                    return prevSelected;
                });

                setUsers(prevUsers => {
                    const index = prevUsers.findIndex(u => String(u.id) === String(normalizedRoom.id));
                    let newUsers = [...prevUsers];
                    if (index !== -1) {
                        newUsers[index] = { ...newUsers[index], ...normalizedRoom, messages: newUsers[index].messages };
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
        return () => roomUpdateSub?.unsubscribe();
    }, [isConnected, subscribe, currentUser?.id]);

    return { users, setUsers, urlRoomId, navigate };
}