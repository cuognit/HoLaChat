import HeaderChatUser from "./HeaderChatUser";
import { Search, Phone, Video } from "lucide-react"
export default function HeaderChat() {
    return (
        <>
        <div className="bg-white h-18 p-4 border-b border-gray-200 flex items-center justify-between">
            <HeaderChatUser userName="Nguyễn Mạnh Cường" status="Vừa truy cập" userAvatar="/notfound.png" />
            <div className="flex items-center gap-4">
                <Phone className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                <Video className="text-gray-400 hover:text-gray-600 cursor-pointer " />
                <Search className="text-gray-400 hover:text-gray-600 cursor-pointer " />
            </div>
        </div>
        </>
    );
}