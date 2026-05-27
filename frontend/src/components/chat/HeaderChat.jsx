import React, { useRef } from "react";
import { Search, Phone, Video, PanelRight } from "lucide-react";
import HeaderChatUser from "./HeaderChatUser";
import { useChat } from "../../hooks/useChat";
import DialogWindow from "./dialog/DialogWindow";
import FriendProfile from "./dialog/FriendProfile";

export default function HeaderChat({ toggleInfo, showInfo }) {
    const { selectedUser, currentUser } = useChat();
    const friendProfileRef = useRef();

    if (!selectedUser) {
        return null;
    }

    const isGroup = selectedUser.isGroup === true;

    const handleOpenProfile = () => {
        // Chỉ mở Dialog FriendProfile khi đây là phòng chat riêng (isGroup === false)
        if (!isGroup && selectedUser.targetUserId) {
            friendProfileRef.current.open();
        } else if (isGroup && !showInfo) {
            // Nếu là nhóm, click vào avatar thì mở panel bên phải (Thông tin hội thoại)
            toggleInfo();
        }
    };

    const displayName = isGroup 
        ? (selectedUser.roomName || "Nhóm chat") 
        : (selectedUser.targetUserName || "User");

    const displayAvatar = isGroup 
        ? selectedUser.avatarUrl 
        : (selectedUser.targetAvatarUrl || "/avatar.jpg");

    const displayStatus = isGroup 
        ? `${selectedUser.memberCount || 0} thành viên`
        : (selectedUser.isOnline !== undefined ? (selectedUser.isOnline ? "Đang hoạt động" : "Không hoạt động") : "Chưa có trạng thái");

    return (
        <div className="bg-white h-18 p-4 border-b border-gray-200 flex items-center justify-between">
            
            <div onClick={handleOpenProfile} className="flex-1 max-w-[50%]">
                <HeaderChatUser
                    userName={displayName}
                    status={displayStatus}
                    userAvatar={displayAvatar}
                    friendshipStatus={selectedUser.friendshipStatus}
                    friendshipSenderId={selectedUser.friendshipSenderId}
                    currentUserId={currentUser?.id}
                    isGroup={isGroup}
                />
            </div>

            <div className="flex items-center gap-4">
                <Phone className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                <Video className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                <Search className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
                <PanelRight 
                    onClick={toggleInfo}
                    className={`cursor-pointer transition-colors ${showInfo ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`} 
                />
            </div>

            {/* Dialog Thông tin tài khoản bạn bè */}
            {!isGroup && (
                <DialogWindow 
                    dialogForm={
                        <FriendProfile 
                            userId={selectedUser.targetUserId} 
                            onClose={() => friendProfileRef.current.close()}
                            externalFriendshipStatus={selectedUser.friendshipStatus}
                            externalFriendshipSenderId={selectedUser.friendshipSenderId}
                            onUnfriendSuccess={() => {
                                // TODO: cập nhật sidebar nếu cần sau khi unfriend
                            }}
                        />
                    } 
                    ref={friendProfileRef} 
                    position={`m-auto p-0 bg-transparent border-none text-gray-800 rounded-2xl w-[400px] max-w-[90vw] shadow-2xl`} 
                />
            )}
        </div>
    );
}