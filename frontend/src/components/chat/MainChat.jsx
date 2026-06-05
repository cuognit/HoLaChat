import HeaderChat from "./HeaderChat";
import SendChat from "./SendChat";
import DisplayMessage from "./DisplayMessage";
import { useChat } from "../../hooks/useChat";
import WelcomeScreen from "./WelcomeScreen";
import ConversationInfo from "./ConversationInfo";
import ShareMessageModal from "./dialog/ShareMessageModal";
import { useState, useEffect } from "react";

export default function MainChat() {
    const { selectedUser } = useChat();
    const [showInfo, setShowInfo] = useState(false);

    const [replyingToMessage, setReplyingToMessage] = useState(null);
    const [sharingMessage, setSharingMessage] = useState(null);

    // Xóa tin nhắn đang trả lời khi đổi phòng chat
    useEffect(() => {
        setReplyingToMessage(null);
    }, [selectedUser?.roomId]);

    if (!selectedUser) {
        return <WelcomeScreen />;
    }

    return (
        <>
            <div className="bg-white flex-1 flex flex-col h-screen justify-between w-full min-w-0">
                <HeaderChat toggleInfo={() => setShowInfo(!showInfo)} showInfo={showInfo} />
                <DisplayMessage onReply={setReplyingToMessage} onShare={setSharingMessage} />
                <SendChat replyingToMessage={replyingToMessage} onCancelReply={() => setReplyingToMessage(null)} />
            </div>
            {showInfo && <ConversationInfo />}
            
            <ShareMessageModal 
                isOpen={!!sharingMessage} 
                onClose={() => setSharingMessage(null)} 
                messageData={sharingMessage} 
            />
        </>
    );
}
