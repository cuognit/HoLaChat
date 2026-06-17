import { AlertTriangle, Trash2, LogOut, X } from 'lucide-react';
import { useResponsive } from '../../../hooks/useResponsive';

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    type = "danger" // "danger" | "warning" | "info"
}) {
    const { isMobile } = useResponsive();
    if (!isOpen) return null;

    // Phân loại Icon và màu sắc cho từng trường hợp
    const getTheme = () => {
        switch (type) {
            case "danger":
                return {
                    icon: <Trash2 size={24} className="text-red-500" />,
                    bgIcon: "bg-red-50",
                    btnConfirm: "bg-red-600 hover:bg-red-700 text-white shadow-red-100 focus:ring-red-500",
                };
            case "warning":
                return {
                    icon: <AlertTriangle size={24} className="text-amber-500" />,
                    bgIcon: "bg-amber-50",
                    btnConfirm: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100 focus:ring-amber-500",
                };
            case "info":
            default:
                return {
                    icon: <LogOut size={24} className="text-blue-500" />,
                    bgIcon: "bg-blue-50",
                    btnConfirm: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 focus:ring-blue-500",
                };
        }
    };

    const theme = getTheme();

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center select-none ${isMobile ? 'p-3' : 'p-4'}`}>
            {/* Backdrop làm mờ tinh tế */}
            <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
                onClick={onCancel}
            />

            {/* Khung Dialog chính với hiệu ứng Scale nhẹ */}
            <div className={`relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-2xl transition-all border border-gray-100 animate-scale-up duration-200 ${isMobile ? 'p-4' : 'p-6'}`}>
                
                {/* Nút đóng góc phải */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
                >
                    <X size={18} />
                </button>

                {/* Nội dung chính */}
                <div className="flex gap-4 items-start">
                    {/* Icon đại diện cho hành động */}
                    <div className={`p-3 rounded-xl shrink-0 ${theme.bgIcon} flex items-center justify-center`}>
                        {theme.icon}
                    </div>

                    <div className="flex-1 min-w-0 font-sans">
                        <h3 className="text-base font-bold text-gray-900 mb-1.5 leading-snug">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Nhóm Nút hành động */}
                <div className={`mt-6 flex gap-3 ${isMobile ? 'flex-col-reverse' : 'justify-end'}`}>
                    <button
                        onClick={onCancel}
                        className="px-4.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 transition-all active:scale-[0.98] cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] cursor-pointer ${theme.btnConfirm}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
