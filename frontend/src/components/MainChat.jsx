import HeaderChat from "./HeaderChat";
import SendChat from "./SendChat";
import DisplayMessage from "./DisplayMessage";
export default function MainChat() {
    return (
        <>
        <div className="bg-white flex-1 flex flex-col h-screen justify-between w-full">
            <HeaderChat />
            <DisplayMessage />
            <SendChat />
        </div>
        </>
    );
}