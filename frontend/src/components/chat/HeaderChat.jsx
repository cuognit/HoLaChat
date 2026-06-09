import React, { useRef } from "react";
import { Search, Phone, Video, PanelRight } from "lucide-react";
import HeaderChatUser from "./HeaderChatUser";
import { useChat } from "../../hooks/useChat";
import DialogWindow from "./dialog/DialogWindow";
import FriendProfile from "./dialog/FriendProfile";
import { initiateCall } from "../../api/callApi";
import { useCall } from "../../context/CallContext";

export default function HeaderChat({ toggleInfo, showInfo }) {
    const { selectedUser, currentUser } = useChat();
    const { setCallingState } = useCall();
    const friendProfileRef = useRef();

    if (!selectedUser) {
        return null;
    }

    const isGroup = selectedUser.isGroup === true;

    const handleOpenProfile = () => {
        if (!isGroup && selectedUser.targetUserId) {
            friendProfileRef.current.open();
        } else if (isGroup && !showInfo) {
            toggleInfo();
        }
    };

    const handleCall = async (type = 'AUDIO') => {
        if (isGroup) {
            alert("Gọi nhóm sẽ được hỗ trợ trong tương lai.");
            return;
        }
        try {
            setCallingState({
                callType: type,
                otherPartyInfo: {
                    id: selectedUser.targetUserId,
                    userName: selectedUser.targetUserName,
                    avatarUrl: selectedUser.targetAvatarUrl
                }
            });
            const res = await initiateCall(selectedUser.targetUserId, selectedUser.roomId, type);
            setCallingState({
                sessionId: res.sessionId,
                livekitToken: res.livekitToken, // Usually only for caller
                roomId: selectedUser.roomId,
                callType: type,
                otherPartyInfo: {
                    id: selectedUser.targetUserId,
                    userName: selectedUser.targetUserName,
                    avatarUrl: selectedUser.targetAvatarUrl
                }
            });
        } catch (err) {
            console.error("Initiate call error:", err);
            setCallingState(null);
            alert("Không thể thực hiện cuộc gọi. " + (err.response?.data?.message || err.message));
        }
    };

    const displayName = isGroup 
        ? (selectedUser.roomName || "Nhóm chat") 
        : (selectedUser.targetUserName || "User");

    const displayAvatar = isGroup 
        ? selectedUser.avatarUrl 
        : (selectedUser.targetAvatarUrl || "/avatar.jpg");

    const statusText = isGroup ? `${selectedUser.memberCount || 0} thành viên` : "";

    return (
        <div className="bg-white h-18 p-4 border-b border-gray-200 flex items-center justify-between">
            
            <div onClick={handleOpenProfile} className="flex-1 max-w-[50%]">
                <HeaderChatUser
                    userName={displayName}
                    isOnline={selectedUser.isOnline}
                    lastActiveAt={selectedUser.lastActiveAt}
                    statusText={statusText}
                    userAvatar={displayAvatar}
                    friendshipStatus={selectedUser.friendshipStatus}
                    friendshipSenderId={selectedUser.friendshipSenderId}
                    currentUserId={currentUser?.id}
                    isGroup={isGroup}
                />
            </div>

            <div className="flex items-center gap-4">
                <Phone onClick={() => handleCall('AUDIO')} className="text-blue-500 hover:text-blue-700 cursor-pointer" />
                <Video onClick={() => handleCall('VIDEO')} className="text-blue-500 hover:text-blue-700 cursor-pointer" />
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