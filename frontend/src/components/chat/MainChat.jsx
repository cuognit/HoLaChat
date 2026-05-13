import HeaderChat from "./HeaderChat";
import SendChat from "./SendChat";
import DisplayMessage from "./DisplayMessage";
import { useChat } from "../../hooks/useChat";
import WelcomeScreen from "./WelcomeScreen";
import ConversationInfo from "./ConversationInfo";
import { useState } from "react";

export default function MainChat() {
    const { selectedUser } = useChat();
    const [showInfo, setShowInfo] = useState(false);

    if (!selectedUser) {
        return <WelcomeScreen />;
    }

    return (
        <>
            <div className="bg-white flex-1 flex flex-col h-screen justify-between w-full min-w-0">
                <HeaderChat toggleInfo={() => setShowInfo(!showInfo)} showInfo={showInfo} />
                <DisplayMessage />
                <SendChat />
            </div>
            {showInfo && <ConversationInfo />}
        </>
    );
}
