import HeaderChat from "./HeaderChat";
import SendChat from "./SendChat";
import DisplayMessage from "./DisplayMessage";
import { useChat } from "../../hooks/useChat";
import WelcomeScreen from "./WelcomeScreen";
import ConversationInfo from "./ConversationInfo";
import ShareMessageModal from "./dialog/ShareMessageModal";
import { useState, useEffect } from "react";

export default function MainChat({ isMobile = false, isTablet = false, onBack, onOpenInfo, showInfoFullScreen = false, onCloseInfo }) {
    const { selectedUser } = useChat();
    const [showInfo, setShowInfo] = useState(false);

    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const [sharingMessage, setSharingMessage] = useState(null);

    // Xóa tin nhắn đang trả lời khi đổi phòng chat
    useEffect(() => {
        setReplyingToMessage(null);
    }, [selectedUser?.roomId]);

    // Trên mobile, khi showInfoFullScreen=true → hiện ConversationInfo full screen
    if (isMobile && showInfoFullScreen) {
        return (
            <div className="h-screen w-full bg-white flex flex-col mobile-slide-in-right">
                <ConversationInfo
                    isMobile={true}
                    onClose={onCloseInfo}
                />
            </div>
        );
    }

    if (!selectedUser) {
        return <WelcomeScreen isMobile={isMobile} />;
    }

    const handleToggleInfo = () => {
        if (isMobile) {
            // Trên mobile, mở ConversationInfo full screen
            onOpenInfo?.();
        } else {
            setShowInfo(!showInfo);
        }
    };

    return (
        <>
            <div className="bg-white flex-1 flex flex-col h-screen justify-between w-full min-w-0">
                <HeaderChat
                    toggleInfo={handleToggleInfo}
                    showInfo={showInfo}
                    isMobile={isMobile}
                    onBack={onBack}
                />
                <DisplayMessage onReply={setReplyingToMessage} onShare={setSharingMessage} />
                <SendChat replyingToMessage={replyingToMessage} onCancelReply={() => setReplyingToMessage(null)} />
            </div>
            {!isMobile && showInfo && <ConversationInfo isTablet={isTablet} />}
            
            <ShareMessageModal 
                isOpen={!!sharingMessage} 
                onClose={() => setSharingMessage(null)} 
                messageData={sharingMessage} 
            />
        </>
    );
}
