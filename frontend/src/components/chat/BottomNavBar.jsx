import { MessageSquare, Settings } from "lucide-react";

/**
 * Bottom Navigation Bar cho mobile.
 * Chỉ hiển thị trên mobile khi đang ở view chatList.
 */
export default function BottomNavBar({ activeTab, onTabChange, unreadCount, onOpenContact, onOpenSettings }) {
    return (
        <nav className="bottom-nav">
            <button
                className={`bottom-nav-item ${activeTab === 'messages' ? 'active' : 'text-gray-400'}`}
                onClick={() => onTabChange('messages')}
            >
                <MessageSquare className="w-5.5 h-5.5" />
                <span className="nav-label">Tin nhắn</span>
                {unreadCount > 0 && (
                    <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            <button
                className={`bottom-nav-item ${activeTab === 'settings' ? 'active' : 'text-gray-400'}`}
                onClick={() => {
                    onTabChange('settings');
                    onOpenSettings?.();
                }}
            >
                <Settings className="w-5.5 h-5.5" />
                <span className="nav-label">Cài đặt</span>
            </button>
        </nav>
    );
}
