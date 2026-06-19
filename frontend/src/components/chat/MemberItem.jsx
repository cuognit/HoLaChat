/**
 * File: MemberItem.jsx
 * Chức năng: Thành phần giao diện (UI component) của ứng dụng.
 */
import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Crown, UserMinus, ShieldCheck, ShieldOff, Info } from "lucide-react";
import { useChat } from "../../hooks/useChat";

export default function MemberItem({ member, myRole, currentUserId, roomId, onRoleChange, onKick }) {
    const { userStatusMap } = useChat();
    const isAdmin = member.role === "ADMIN";
    const isSelf = member.userId === currentUserId;
    const canManage = myRole === "ADMIN" && !isSelf;

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Đóng menu khi click ngoài
    useEffect(() => {
        const handle = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    // Lấy trạng thái online thời gian thực từ context, fallback về thông tin tĩnh từ database
    const statusObj = userStatusMap[String(member.userId)];
    const isOnline = statusObj ? statusObj.isOnline : (member.isOnline ?? false);

    return (
        <div className={`flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors group relative ${
            menuOpen ? "z-40 shadow-xs" : "z-0"
        }`}>
            {/* Avatar */}
            <div className="relative shrink-0">
                <img
                    src={member.avatarUrl || "/avatar.jpg"}
                    alt={member.userName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <span
                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white transition-colors duration-300
                        ${isOnline ? "bg-green-500" : "bg-gray-300"}`}
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                        {member.userName}
                        {isSelf && <span className="text-gray-400 font-normal"> (bạn)</span>}
                    </p>
                    {isAdmin && (
                        <Crown size={13} className="text-yellow-500 shrink-0" />
                    )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                    {isAdmin ? "Quản trị viên" : "Thành viên"}
                </p>
            </div>

            {/* Context menu button — chỉ ADMIN thấy với người khác */}
            {canManage && (
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(prev => !prev)}
                        className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-xl w-44 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                            {/* Nâng/hạ quyền */}
                            {!isAdmin ? (
                                <button
                                    onClick={() => { onRoleChange(member.userId, "ADMIN"); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <ShieldCheck size={13} />
                                    Nâng lên quản trị viên
                                </button>
                            ) : (
                                <button
                                    onClick={() => { onRoleChange(member.userId, "MEMBER"); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-orange-500 hover:bg-orange-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <ShieldOff size={13} />
                                    Hạ xuống thành viên
                                </button>
                            )}

                            {/* Xóa khỏi nhóm */}
                            <div className="border-t border-gray-50 mt-1 pt-1">
                                <button
                                    onClick={() => { onKick(member.userId, member.userName); setMenuOpen(false); }}
                                    className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                                >
                                    <UserMinus size={13} />
                                    Xóa khỏi nhóm
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}