import { useChat } from "../../hooks/useChat";

export default function TypingIndicator() {
    const { selectedUser, currentUser, typingUsersMap } = useChat();
    const roomId = selectedUser?.roomId;
    const currentUserId = currentUser?.id;

    if (!roomId) return null;

    // Lọc bỏ chính mình khỏi danh sách typing
    const typingUsers = (typingUsersMap[roomId] ?? []).filter(
        u => String(u.userId) !== String(currentUserId)
    );

    if (typingUsers.length === 0) return null;

    const isGroup = selectedUser?.isGroup === true;

    // Tên hiển thị
    const displayText = isGroup
        ? typingUsers.length === 1
            ? `${typingUsers[0].userName} đang nhập`
            : `${typingUsers.length} người đang nhập`
        : "Đang nhập";

    return (
        <div className="flex items-center gap-2 px-4 py-1.5 animate-fade-in">
            {/* Avatar - group: hiện avatar người đang gõ, 1-1: hiện avatar đối phương */}
            {isGroup ? (
                <div className="flex -space-x-2">
                    {typingUsers.slice(0, 3).map(u => (
                        <img
                            key={u.userId}
                            src={u.avatarUrl || "/avatar.jpg"}
                            alt={u.userName}
                            className="w-5 h-5 rounded-full border border-white object-cover"
                        />
                    ))}
                </div>
            ) : (
                <img
                    src={selectedUser.targetAvatarUrl || selectedUser.avatarUrl || "/avatar.jpg"}
                    alt="typing"
                    className="w-5 h-5 rounded-full border border-white object-cover"
                />
            )}

            {/* Bouncing dots bubble */}
            <div className="bg-gray-200 rounded-2xl px-3 py-2 flex items-center gap-0.5">
                <span className="typing-dot w-[6px] h-[6px] bg-gray-500 rounded-full inline-block" style={{ animationDelay: "0ms" }}></span>
                <span className="typing-dot w-[6px] h-[6px] bg-gray-500 rounded-full inline-block" style={{ animationDelay: "150ms" }}></span>
                <span className="typing-dot w-[6px] h-[6px] bg-gray-500 rounded-full inline-block" style={{ animationDelay: "300ms" }}></span>
            </div>

            <span className="text-xs text-gray-400">{displayText}</span>
        </div>
    );
}
