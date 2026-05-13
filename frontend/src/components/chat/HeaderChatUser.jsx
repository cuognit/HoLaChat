import { Dot } from "lucide-react";
export default function HeaderChatUser({ userName, status, userAvatar }) {
    return (
        <div className="w-full flex items-center p-2 cursor-pointer bg-white">
            <div className="flex relative">
                <img
                src={userAvatar}
                alt={userName}
                className="w-13 h-13 rounded-full object-cover border border-gray-300 mb-1"
                />
                {status === "Đang hoạt động" ? (
                    <span className="relative -left-3 top-9 border-white border-2 w-3 h-3 bg-green-400 rounded-full me-1"></span>
                ) : (
                    <span className=" relative -left-3 top-9 border-white border-2 w-3 h-3 bg-gray-400 rounded-full me-1"></span>
                )}
            </div>
            
            <div className="flex-1 flex flex-col min-w-0 justify-center">
                <h3 className="text-lg font-medium">{userName}</h3>
                <p className="truncate text-gray-400 flex items-center text-sm">
                    {status}
                </p>
            </div>
        </div>
    );
}
