import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users2, Loader2, MessageSquare, ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import api from "../api/axiosConfig";
import { useChat } from "../hooks/useChat";

export default function JoinGroupPage() {
    const { encodedRoomId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useChat();

    const [roomInfo, setRoomInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Fetch thông tin phòng
    useEffect(() => {
        const fetchRoomInfo = async () => {
            setIsLoading(true);
            setErrorMsg("");
            try {
                const res = await api.get(`/chat-rooms/join-info/${encodedRoomId}`);
                if (res.data?.status === 200) {
                    setRoomInfo(res.data.data);
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin nhóm:", err);
                setErrorMsg(err.response?.data?.message || "Đường link mời không hợp lệ hoặc đã hết hạn!");
            } finally {
                setIsLoading(false);
            }
        };

        if (encodedRoomId) {
            fetchRoomInfo();
        }
    }, [encodedRoomId]);

    const handleJoinGroup = async () => {
        if (!roomInfo?.id) return;
        
        // Nếu đã là thành viên nhóm từ trước, chuyển hướng thẳng vào phòng chat
        if (roomInfo.currentUserRole) {
            navigate(`/c/${roomInfo.id}`, { replace: true });
            return;
        }

        setIsJoining(true);
        try {
            const res = await api.post(`/chat-rooms/${roomInfo.id}/join`);
            if (res.data?.status === 200) {
                toast.success(`Chúc mừng! Bạn đã tham gia nhóm "${roomInfo.roomName}" thành công!`);
                // Chuyển hướng trực tiếp vào phòng chat nhóm
                navigate(`/c/${roomInfo.id}`, { replace: true });
            }
        } catch (err) {
            console.error("Lỗi gia nhập nhóm:", err);
            toast.error(err.response?.data?.message || "Tham gia nhóm thất bại!");
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans px-4 py-8 select-none">
            {/* Logo ở góc trên */}
            <div className="absolute top-4 md:top-8 flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                <h1 className="text-[#0068ff] font-bold text-2xl md:text-4xl tracking-tight">HoLa</h1>
            </div>

            {/* Container chính */}
            <div className="w-full max-w-[90vw] md:max-w-[420px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/60 flex flex-col p-4 md:p-6 items-center text-center animate-in fade-in zoom-in-95 duration-200">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-[#0068ff]" />
                        <p className="text-sm font-semibold text-gray-500">Đang tải thông tin nhóm...</p>
                    </div>
                ) : errorMsg ? (
                    <div className="flex flex-col items-center py-8 gap-4">
                        <div className="p-3.5 bg-amber-50 text-amber-500 rounded-full border border-amber-100 shadow-2xs">
                            <ShieldAlert size={36} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Liên kết không khả dụng</h2>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">{errorMsg}</p>
                        <button
                            onClick={() => navigate("/")}
                            className="mt-4 flex items-center gap-1.5 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-full transition-colors cursor-pointer"
                        >
                            <ArrowLeft size={14} /> Quay về Trang chủ
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Invitation Banner */}
                        <div className="px-3.5 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold tracking-wider uppercase border border-blue-100/50 mb-6 shrink-0 shadow-2xs">
                            Lời mời tham gia nhóm
                        </div>

                        {/* Group Avatar */}
                        <div className="relative mb-4 shrink-0">
                            {roomInfo.avatarUrl ? (
                                <img
                                    src={roomInfo.avatarUrl}
                                    alt={roomInfo.roomName}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-white bg-white shadow-md ring-1 ring-gray-100/50"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-md ring-1 ring-gray-100/50">
                                    <Users2 size={36} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Group Name & Stats */}
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate max-w-full px-2" title={roomInfo.roomName}>
                            {roomInfo.roomName}
                        </h2>
                        
                        <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 bg-gray-100/80 rounded-full text-xs font-semibold text-gray-500 shadow-2xs">
                            <Users2 size={13} />
                            <span>{roomInfo.memberCount || 0} thành viên</span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-400 leading-relaxed max-w-[280px] mt-6">
                            {roomInfo.currentUserRole ? (
                                <>
                                    Bạn đã là thành viên của nhóm chat này. Bấm vào nút bên dưới để chuyển hướng đến phòng trò chuyện và tiếp tục thảo luận ngay!
                                </>
                            ) : (
                                <>
                                    Chào <strong>{currentUser?.userName || "bạn"}</strong>, bạn đã nhận được lời mời tham gia cuộc trò chuyện của nhóm chat này. Bấm vào nút bên dưới để xác nhận gia nhập và bắt đầu nhắn tin ngay.
                                </>
                            )}
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col gap-2.5 w-full mt-8 shrink-0">
                            <button
                                onClick={handleJoinGroup}
                                disabled={isJoining}
                                className="flex items-center justify-center gap-1.5 w-full py-3 bg-[#0068ff] hover:bg-blue-700 active:scale-[0.98] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                            >
                                {isJoining ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                                {isJoining 
                                    ? "Đang tham gia..." 
                                    : roomInfo.currentUserRole 
                                        ? "Vào phòng trò chuyện" 
                                        : "Tham gia nhóm & Chat ngay"}
                            </button>
                            <button
                                onClick={() => navigate("/")}
                                disabled={isJoining}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                            >
                                Từ chối
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
