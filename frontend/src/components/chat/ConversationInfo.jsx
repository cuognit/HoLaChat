import { AlarmClock, Users, ChevronDown, ChevronUp, Clock, HelpCircle, EyeOff, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useChat } from '../../hooks/useChat';

export default function ConversationInfo() {
    const { selectedUser } = useChat();
    
    // Trạng thái mở/đóng của các section
    const [openSections, setOpenSections] = useState({
        media: false,
        file: false,
        link: false,
        security: true
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (!selectedUser) return null;

    return (
        <div className="w-[340px] shrink-0 bg-white border-l border-gray-200 h-screen flex flex-col overflow-y-auto overflow-x-hidden">
            {/* Header */}
            <div className="h-18 flex items-center justify-center border-b border-gray-200 shrink-0">
                <h2 className="text-[17px] font-semibold text-gray-800">Thông tin hội thoại</h2>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col items-center py-5 border-b border-gray-100">
                <img 
                    src={selectedUser.targetAvatarUrl || "/avatar.jpg"} 
                    alt={selectedUser.targetUserName} 
                    className="w-[60px] h-[60px] rounded-full object-cover border border-gray-200 mb-3"
                />
                <div className="flex items-center gap-2">
                    <span className="text-[17px] font-medium text-gray-900">{selectedUser.targetUserName}</span>
                    <button className="p-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                        <Pencil size={14} />
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col py-2 border-b border-gray-100">
                <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <AlarmClock className="text-gray-600" size={20} strokeWidth={1.5} />
                    <span className="text-[15px] text-gray-700">Danh sách nhắc hẹn</span>
                </button>
                <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <Users className="text-gray-600" size={20} strokeWidth={1.5} />
                    <span className="text-[15px] text-gray-700">2 nhóm chung</span>
                </button>
            </div>

            {/* Accordions */}
            <div className="flex-1 overflow-y-auto">
                {/* Media */}
                <div className="border-b border-gray-100">
                    <button 
                        onClick={() => toggleSection('media')}
                        className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-[15px] font-medium text-gray-800">Ảnh/Video</span>
                        {openSections.media ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                    </button>
                    {openSections.media && (
                        <div className="px-4 pb-4 pt-1 flex justify-center">
                            <p className="text-sm text-gray-500 text-center">Chưa có Ảnh/Video được chia sẻ<br/>trong hội thoại này</p>
                        </div>
                    )}
                </div>

                {/* File */}
                <div className="border-b border-gray-100">
                    <button 
                        onClick={() => toggleSection('file')}
                        className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-[15px] font-medium text-gray-800">File</span>
                        {openSections.file ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                    </button>
                    {openSections.file && (
                        <div className="px-4 pb-4 pt-1 flex justify-center">
                            <p className="text-sm text-gray-500 text-center">Chưa có File được chia sẻ trong<br/>hội thoại này</p>
                        </div>
                    )}
                </div>

                {/* Link */}
                <div className="border-b border-gray-100">
                    <button 
                        onClick={() => toggleSection('link')}
                        className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-[15px] font-medium text-gray-800">Link</span>
                        {openSections.link ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                    </button>
                    {openSections.link && (
                        <div className="px-4 pb-4 pt-1 flex justify-center">
                            <p className="text-sm text-gray-500 text-center">Chưa có Link được chia sẻ trong<br/>hội thoại này</p>
                        </div>
                    )}
                </div>

                {/* Security Settings */}
                <div className="border-b border-gray-100">
                    <button 
                        onClick={() => toggleSection('security')}
                        className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-[15px] font-medium text-gray-800">Thiết lập bảo mật</span>
                        {openSections.security ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                    </button>
                    {openSections.security && (
                        <div className="flex flex-col">
                            {/* Auto delete message */}
                            <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                                <Clock className="text-gray-800 mt-0.5" size={22} strokeWidth={1.5} />
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[15px] text-gray-800">Tin nhắn tự xóa</span>
                                        <HelpCircle size={14} className="text-gray-400" />
                                    </div>
                                    <span className="text-[13px] text-gray-500 mt-0.5">Không bao giờ</span>
                                </div>
                            </div>
                            
                            {/* Hide conversation */}
                            <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <EyeOff className="text-gray-800" size={22} strokeWidth={1.5} />
                                    <span className="text-[15px] text-gray-800">Ẩn trò chuyện</span>
                                </div>
                                {/* Toggle Switch (visual only for now) */}
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <div className="w-10 h-[22px] bg-gray-300 rounded-full transition-colors"></div>
                                    <div className="absolute left-[2px] top-[2px] w-[18px] h-[18px] bg-white rounded-full transition-transform shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
