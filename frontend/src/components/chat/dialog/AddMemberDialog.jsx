import { useState, useEffect, useRef } from "react";
import { X, Search, Check, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import api from "../../../api/axiosConfig";
import { useChat } from "../../../hooks/useChat";

export default function AddMemberDialog({ roomId, existingMembers = [], onClose, onAdded }) {
    const { currentUser } = useChat();

    const [friends, setFriends] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]); // [{id, userName, avatarUrl}]
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingFriends, setIsLoadingFriends] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const searchTimerRef = useRef(null);

    // Tạo một Set chứa ID của các thành viên hiện tại để kiểm tra nhanh O(1)
    const existingMemberIds = new Set(existingMembers.map(m => m.userId));

    // Tự động load danh sách bạn bè khi mở Dialog
    useEffect(() => {
        if (roomId) {
            fetchFriends();
        }
    }, [roomId]);

    const fetchFriends = async () => {
        setIsLoadingFriends(true);
        try {
            const res = await api.get("/friendships/friends");
            if (res.data?.status === 200) {
                setFriends(res.data.data || []);
            }
        } catch {
            toast.error("Không thể tải danh sách bạn bè");
        } finally {
            setIsLoadingFriends(false);
        }
    };

    // Debounce tìm kiếm 300ms
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        clearTimeout(searchTimerRef.current);

        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await api.get("/auth/search", { params: { email: query.trim() } });
                const results = (res.data?.data || []).filter(u => u.id !== currentUser?.id);
                setSearchResults(results);
            } catch {
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const toggleMember = (user) => {
        // Nếu đã là thành viên trong nhóm thì không cho phép click chọn
        if (existingMemberIds.has(user.id)) return;

        setSelectedMembers(prev => {
            const exists = prev.find(m => m.id === user.id);
            if (exists) return prev.filter(m => m.id !== user.id);
            return [...prev, { id: user.id, userName: user.userName, avatarUrl: user.avatarUrl }];
        });
    };

    const isSelected = (userId) => selectedMembers.some(m => m.id === userId);

    const handleAddMembers = async () => {
        if (selectedMembers.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 thành viên để thêm");
            return;
        }
        setIsAdding(true);
        try {
            const res = await api.post(`/rooms/${roomId}/members`, {
                memberIds: selectedMembers.map(m => m.id)
            });
            
            // Gọi callback thông báo danh sách thành viên mới cập nhật
            onAdded(res.data?.data || []);
            toast.success(`Đã thêm thành công ${selectedMembers.length} thành viên vào nhóm`);
            handleClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thêm thành viên thất bại!");
        } finally {
            setIsAdding(false);
        }
    };

    const handleClose = () => {
        setSelectedMembers([]);
        setSearchQuery("");
        setSearchResults([]);
        onClose?.();
    };

    // Lọc trùng lặp giữa bạn bè và kết quả tìm kiếm người lạ
    const friendIds = new Set(friends.map(f => f.id));
    const extraResults = searchResults.filter(u => !friendIds.has(u.id) && u.id !== currentUser?.id);

    return (
        <div className="w-[480px] max-w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col select-none font-sans">
            {/* Header */}
            <div className="h-14 flex items-center px-4 border-b border-gray-100 shrink-0 justify-between">
                <div className="flex items-center gap-2">
                    <UserPlus size={20} className="text-blue-600 animate-pulse" />
                    <span className="text-lg font-bold text-gray-900">Thêm thành viên vào nhóm</span>
                </div>
                <button
                    onClick={handleClose}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex flex-col h-[520px]">
                {/* Search bar */}
                <div className="px-4 pt-3 pb-2 shrink-0">
                    <div className="flex items-center bg-gray-100 focus-within:bg-white border border-transparent focus-within:border-blue-400 px-3 py-2 rounded-xl gap-2 transition-all shadow-xs">
                        <Search size={16} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Tìm kiếm bạn bè theo tên hoặc email..."
                            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
                        />
                        {isSearching && <Loader2 size={14} className="animate-spin text-blue-400 shrink-0" />}
                    </div>
                </div>

                {/* Chip "đã chọn" hiển thị danh sách người sẽ thêm */}
                {selectedMembers.length > 0 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0 max-h-[85px] overflow-y-auto">
                        {selectedMembers.map(m => (
                            <span key={m.id} className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold border border-blue-100 shadow-2xs animate-in zoom-in-95 duration-150">
                                <img src={m.avatarUrl || "/avatar.jpg"} alt={m.userName} className="w-4 h-4 rounded-full object-cover" />
                                {m.userName}
                                <button onClick={() => toggleMember(m)} className="hover:text-red-500 transition-colors cursor-pointer ml-0.5">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Danh sách */}
                <div className="flex-1 overflow-y-auto px-2">
                    {isLoadingFriends ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-blue-400 w-6 h-6" />
                        </div>
                    ) : (
                        <>
                            {/* Danh sách Bạn bè */}
                            {friends.length > 0 && (
                                <>
                                    <p className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Bạn bè của bạn ({friends.length})
                                    </p>
                                    {friends.map(friend => (
                                        <MemberSelectItem
                                            key={friend.id}
                                            user={friend}
                                            isAlreadyMember={existingMemberIds.has(friend.id)}
                                            isSelected={isSelected(friend.id)}
                                            onToggle={() => toggleMember(friend)}
                                        />
                                    ))}
                                </>
                            )}

                            {/* Kết quả tìm kiếm người lạ bên ngoài */}
                            {extraResults.length > 0 && (
                                <>
                                    <p className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">
                                        Kết quả tìm kiếm ngoài danh bạ
                                    </p>
                                    {extraResults.map(user => (
                                        <MemberSelectItem
                                            key={user.id}
                                            user={user}
                                            isAlreadyMember={existingMemberIds.has(user.id)}
                                            isSelected={isSelected(user.id)}
                                            onToggle={() => toggleMember(user)}
                                        />
                                    ))}
                                </>
                            )}

                            {friends.length === 0 && extraResults.length === 0 && !isSearching && (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                                    <UserPlus size={36} className="stroke-[1.5] text-gray-300" />
                                    <p className="text-xs">
                                        {searchQuery ? "Không tìm thấy kết quả phù hợp" : "Danh sách bạn bè trống"}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-100 shrink-0 flex items-center justify-between gap-3 bg-gray-50/50">
                    <span className="text-xs text-gray-500 font-medium">
                        Đã tích chọn: <strong className="text-blue-600 text-sm">{selectedMembers.length}</strong> người
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleAddMembers}
                            disabled={isAdding || selectedMembers.length === 0}
                            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                        >
                            {isAdding ? <Loader2 size={14} className="animate-spin" /> : null}
                            {isAdding ? "Đang thêm..." : `Xác nhận thêm`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MemberSelectItem({ user, isAlreadyMember, isSelected, onToggle }) {
    return (
        <div
            onClick={!isAlreadyMember ? onToggle : undefined}
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all mb-0.5 border
                ${isAlreadyMember 
                    ? "opacity-50 bg-gray-50/70 border-transparent cursor-not-allowed" 
                    : isSelected
                        ? "bg-blue-50/60 border-blue-200 cursor-pointer"
                        : "hover:bg-gray-50 border-transparent cursor-pointer"
                }`}
        >
            <div className="relative shrink-0">
                <img
                    src={user.avatarUrl || "/avatar.jpg"}
                    alt={user.userName}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.userName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>

            {/* Hiển thị Checkbox hoặc Badge "Đã tham gia" */}
            {isAlreadyMember ? (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-200/60 px-2 py-1 rounded-md shrink-0 select-none">
                    Đã tham gia
                </span>
            ) : (
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                    ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
            )}
        </div>
    );
}