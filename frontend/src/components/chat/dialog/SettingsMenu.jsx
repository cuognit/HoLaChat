/**
 * File: SettingsMenu.jsx
 * Chức năng: Thành phần giao diện (UI component) của ứng dụng.
 */
import { User, Settings, Database, Globe, HelpCircle, ChevronRight } from "lucide-react";
import { useResponsive } from '../../../hooks/useResponsive';

export default function SettingsMenu({ openProfile, openLogout, closeMenu }) {
    const { isMobile } = useResponsive();
    
    function handleProfileClick() {
        if (closeMenu) closeMenu();       // Đóng menu lại ngay lập tức
        if (openProfile) openProfile();   // Mở dialog thông tin cá nhân
    }

    function handleLogoutClick() {
        if (closeMenu) closeMenu();       // Đóng menu lại ngay lập tức
        if (openLogout) openLogout();     // Mở dialog xác nhận đăng xuất
    }

    function handleCloseClick() {
        if (closeMenu) closeMenu();       // Đóng menu
    }

    return (
        <div className={`bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 py-2 flex flex-col text-slate-700 text-[14px] ${isMobile ? 'w-full max-w-[300px]' : 'w-[280px]'}`}>
            {/* Hàng 1: Thông tin tài khoản */}
            <div 
                onClick={handleProfileClick} 
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
            >
                <User className="w-[18px] h-[18px] text-slate-500 stroke-[1.8]" />
                <span className="flex-1 font-medium text-slate-800">Thông tin tài khoản</span>
            </div>

            {/* Hàng 2: Cài đặt */}
            <div 
                onClick={handleCloseClick}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
            >
                <Settings className="w-[18px] h-[18px] text-slate-500 stroke-[1.8]" />
                <span className="flex-1 font-medium text-slate-800">Cài đặt</span>
            </div>

            {/* Đường gạch ngang thứ nhất */}
            <div className="border-t border-slate-100 my-1"></div>

            {/* Hàng 3: Dữ liệu */}
            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors duration-150 group">
                <Database className="w-[18px] h-[18px] text-slate-500 stroke-[1.8]" />
                <span className="flex-1 font-medium text-slate-800">Dữ liệu</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
            </div>

            {/* Hàng 4: Ngôn ngữ */}
            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors duration-150 group">
                <Globe className="w-[18px] h-[18px] text-slate-500 stroke-[1.8]" />
                <span className="flex-1 font-medium text-slate-800">Ngôn ngữ</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
            </div>

            {/* Hàng 5: Hỗ trợ */}
            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors duration-150 group">
                <HelpCircle className="w-[18px] h-[18px] text-slate-500 stroke-[1.8]" />
                <span className="flex-1 font-medium text-slate-800">Hỗ trợ</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
            </div>

            {/* Đường gạch ngang thứ hai */}
            <div className="border-t border-slate-100 my-1"></div>

            {/* Hàng 6: Đăng xuất */}
            <div 
                onClick={handleLogoutClick} 
                className="flex items-center px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
            >
                <span className="font-semibold text-red-500">Đăng xuất</span>
            </div>

            {/* Hàng 7: Thoát */}
            <div 
                onClick={handleCloseClick}
                className="flex items-center px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
            >
                <span className="font-medium text-slate-800">Thoát</span>
            </div>
        </div>
    );
}