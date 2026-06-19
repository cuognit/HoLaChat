/**
 * File: MessageDetailPopup.jsx
 * Chức năng: Thành phần giao diện (UI component) của ứng dụng.
 */
import { X, User, Clock, MessageSquare, FileType } from "lucide-react";

export default function MessageDetailPopup({ isOpen, onClose, message }) {
    if (!isOpen || !message) return null;

    const messageTypeLabels = {
        TEXT: "Văn bản",
        IMAGE: "Hình ảnh",
        VIDEO: "Video",
        FILE: "Tệp tin",
        SYSTEM: "Hệ thống",
    };

    const formatFullTime = (dateStr) => {
        if (!dateStr) return "Không rõ";
        try {
            let d = dateStr;
            if (typeof d === "string") {
                if (d.includes("T") || d.includes("Z")) {
                    d = new Date(d);
                } else {
                    d = new Date(d.replace(" ", "T") + "Z");
                }
            }
            if (d instanceof Date && !isNaN(d.getTime())) {
                return d.toLocaleString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });
            }
        } catch {}
        return String(dateStr);
    };

    const details = [
        { 
            icon: <MessageSquare className="w-4 h-4 text-gray-400" />, 
            label: "Nội dung", 
            value: (() => {
                if (message.messageType === 'IMAGE') return '[Hình ảnh]';
                if (message.messageType === 'VIDEO') return '[Video]';
                if (message.messageType === 'FILE') {
                    try { return `[${JSON.parse(message.content).name}]`; }
                    catch { return '[File đính kèm]'; }
                }
                if (message.messageType === 'CALL') {
                    try {
                        const callData = JSON.parse(message.content);
                        return callData.callType === 'VIDEO' ? '[Cuộc gọi video]' : '[Cuộc gọi thoại]';
                    } catch {
                        return '[Cuộc gọi thoại]';
                    }
                }
                return message.content;
            })()
        },
        { icon: <User className="w-4 h-4 text-gray-400" />, label: "Người gửi", value: message.senderName || "Hệ thống" },
        { icon: <Clock className="w-4 h-4 text-gray-400" />, label: "Thời gian", value: formatFullTime(message.createdAt) },
        { icon: <FileType className="w-4 h-4 text-gray-400" />, label: "Loại", value: messageTypeLabels[message.messageType] || message.messageType },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
            <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800">Chi tiết tin nhắn</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3.5">
                    {details.map((item) => (
                        <div key={item.label} className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">{item.icon}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{item.label}</p>
                                <p className="text-sm text-gray-800 font-medium mt-0.5 break-all">{String(item.value)}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border border-gray-200"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
