import { Search, Phone, Video, PanelRight } from "lucide-react";
import HeaderChatUser from "./HeaderChatUser";
import { useChat } from "../../hooks/useChat";

export default function HeaderChat({ toggleInfo, showInfo }) {
    const { selectedUser } = useChat();

    if (!selectedUser) {
        return null;
    }

    return (
        <div className="bg-white h-18 p-4 border-b border-gray-200 flex items-center justify-between">
            <HeaderChatUser
                userName={selectedUser.targetUserName || "Chua co ten"}
                status={selectedUser.isOnline !== undefined ? (selectedUser.isOnline ? "Đang hoạt động" : "Không hoạt động") : "Chua co trang thai"}
                userAvatar={selectedUser.targetAvatarUrl || "/avatar.jpg"}
            />
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
        </div>
    );
}
