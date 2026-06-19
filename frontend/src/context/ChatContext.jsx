/**
 * File: ChatContext.jsx
 * Chức năng: Quản lý state toàn cục (Context API) của ứng dụng.
 */
import { useState, useCallback } from 'react';
import { ChatContext } from './chatContextInstance';

export default function ChatProvider({ children }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userStatusMap, setUserStatusMap] = useState({}); // Lưu trạng thái online/offline của users
  const [typingUsersMap, setTypingUsersMap] = useState({}); // key: roomId, value: [{ userId, userName, avatarUrl }]

  const updateUserStatus = (email, isOnline, userId, lastActiveAt) => {
    setUserStatusMap(prev => {
      const updated = { ...prev };
      const statusObj = { isOnline, lastActiveAt };
      if (email) updated[email.toLowerCase()] = statusObj;
      if (userId) updated[String(userId)] = statusObj;
      return updated;
    });
  };

  const updateTypingUser = useCallback((roomId, userId, userName, avatarUrl, isTyping) => {
    setTypingUsersMap(prev => {
      const currentList = prev[roomId] ?? [];

      if (isTyping) {
        // Thêm user vào danh sách typing (nếu chưa có)
        const alreadyExists = currentList.some(u => String(u.userId) === String(userId));
        if (alreadyExists) return prev;
        return {
          ...prev,
          [roomId]: [...currentList, { userId, userName, avatarUrl }],
        };
      } else {
        // Xóa user khỏi danh sách typing
        const filtered = currentList.filter(u => String(u.userId) !== String(userId));
        if (filtered.length === currentList.length) return prev;
        return {
          ...prev,
          [roomId]: filtered,
        };
      }
    });
  }, []);

  return (
    <ChatContext.Provider value={{
      selectedUser,
      setSelectedUser,
      currentUser,
      setCurrentUser,
      userStatusMap,
      updateUserStatus,
      typingUsersMap,
      updateTypingUser,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
