import { useState } from 'react';
import { ChatContext } from './chatContextInstance';

export default function ChatProvider({ children }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userStatusMap, setUserStatusMap] = useState({}); // Lưu trạng thái online/offline của users

  const updateUserStatus = (email, isOnline, userId) => {
    setUserStatusMap(prev => ({
      ...prev,
      [email]: isOnline
    }));
  };

  return (
    <ChatContext.Provider value={{
      selectedUser,
      setSelectedUser,
      currentUser,
      setCurrentUser,
      userStatusMap,
      updateUserStatus
    }}>
      {children}
    </ChatContext.Provider>
  );
}
