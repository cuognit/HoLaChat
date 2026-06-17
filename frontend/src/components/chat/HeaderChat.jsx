import React, { useRef } from "react";
import { Search, Phone, Video, PanelRight, ArrowLeft } from "lucide-react";
import HeaderChatUser from "./HeaderChatUser";
import { useChat } from "../../hooks/useChat";
import DialogWindow from "./dialog/DialogWindow";
import FriendProfile from "./dialog/FriendProfile";
import { initiateCall } from "../../api/callApi";
import { useCall } from "../../context/CallContext";

export default function HeaderChat({ toggleInfo, showInfo, isMobile = false, onBack }) {
    const { selectedUser, currentUser } = useChat();
    const { setCallingState } = useCall();
    const friendProfileRef = useRef();

    if (!selectedUser) {
        return null;
    }

    const isGroup = selectedUser.isGroup === true;

    const [activeGroupCall, setActiveGroupCall] = React.useState(null);

    React.useEffect(() => {
        const roomId = selectedUser?.roomId || selectedUser?.id;
        if (!isGroup || !roomId) {
            setActiveGroupCall(null);
            return;
        }
        const fetchCall = async () => {
            try {
                const res = await import('../../api/callApi').then(m => m.getActiveCallByRoom(roomId));
                if (res && res.status === 'ACTIVE') {
                    setActiveGroupCall(res);
                } else {
                    setActiveGroupCall(null);
                }
            } catch (err) {
                setActiveGroupCall(null);
            }
        };
        fetchCall();
        const interval = setInterval(fetchCall, 5000);
        return () => clearInterval(interval);
    }, [isGroup, selectedUser?.roomId, selectedUser?.id]);

    const handleOpenProfile = () => {
        if (!isGroup && selectedUser.targetUserId) {
            friendProfileRef.current.open();
        } else if (isGroup && !showInfo) {
            toggleInfo();
        }
    };

    const { setActiveCall } = useCall();
    const handleCall = async (type = 'AUDIO') => {
        try {
            const roomId = selectedUser.roomId || selectedUser.id;
            if (isGroup) {
                const res = await initiateCall(null, roomId, type);
                if (res.status === 'ACTIVE') {
                    setActiveCall({
                        sessionId: res.sessionId,
                        livekitToken: res.livekitToken,
                        roomName: res.roomName,
                        roomId: roomId,
                        callType: type,
                        isGroup: true
                    });
                }
            } else {
                setCallingState({
                    callType: type,
                    otherPartyInfo: {
                        id: selectedUser.targetUserId,
                        userName: selectedUser.targetUserName,
                        avatarUrl: selectedUser.targetAvatarUrl
                    }
                });
                const res = await initiateCall(selectedUser.targetUserId, roomId, type);
                setCallingState({
                    sessionId: res.sessionId,
                    livekitToken: res.livekitToken,
                    roomName: res.roomName,
                    roomId: roomId,
                    callType: type,
                    otherPartyInfo: {
                        id: selectedUser.targetUserId,
                        userName: selectedUser.targetUserName,
                        avatarUrl: selectedUser.targetAvatarUrl
                    }
                });
            }
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

    const handleJoinGroupCall = async () => {
        if (!activeGroupCall) return;
        try {
            const m = await import('../../api/callApi');
            const res = await m.acceptCall(activeGroupCall.sessionId);
            const roomId = selectedUser.roomId || selectedUser.id;
            setActiveCall({
                sessionId: res.sessionId,
                livekitToken: res.livekitToken,
                roomName: res.roomName,
                roomId: roomId,
                callType: activeGroupCall.callType,
                isGroup: true
            });
        } catch(err) {
            console.error(err);
            alert("Lỗi tham gia: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="relative">
            <div className="bg-white h-14 md:h-18 p-2 md:p-4 border-b border-gray-200 flex items-center justify-between">
                
                <div className="flex items-center flex-1 min-w-0 gap-1">
                    {/* Nút Back trên mobile */}
                    {isMobile && (
                        <button
                            onClick={onBack}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer flex-shrink-0 -ml-1"
                            title="Quay lại"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}

                    <div onClick={handleOpenProfile} className="flex-1 min-w-0 max-w-[80%]">
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
                </div>

                <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'} flex-shrink-0`}>
                    {!isGroup && (
                        <Phone onClick={() => handleCall('AUDIO')} className="text-blue-500 hover:text-blue-700 cursor-pointer w-5 h-5 md:w-6 md:h-6" />
                    )}
                    <Video onClick={() => handleCall('VIDEO')} className="text-blue-500 hover:text-blue-700 cursor-pointer w-5 h-5 md:w-6 md:h-6" />
                    {!isMobile && (
                        <Search className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                    )}
                    {!isMobile && <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>}
                    <PanelRight 
                        onClick={toggleInfo}
                        className={`cursor-pointer transition-colors w-5 h-5 md:w-6 md:h-6 ${showInfo ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`} 
                    />
                </div>
            </div>
            
            {/* Active Group Call Banner */}
            {isGroup && activeGroupCall && (
                <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between shadow-sm animate-fade-in z-10 relative">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 animate-pulse">
                            {activeGroupCall.callType === 'VIDEO' ? <Video size={16} /> : <Phone size={16} />}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Cuộc gọi nhóm đang diễn ra</p>
                            <p className="text-xs text-gray-500">Chạm để tham gia trò chuyện</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleJoinGroupCall}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors shadow-sm"
                    >
                        Tham gia
                    </button>
                </div>
            )}
            
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