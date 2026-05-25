export default function Menu({ userName, email, avatarUrl, openProfile, openLogout, closeMenu }) {
    
    function handleProfileClick() {
        if (closeMenu) closeMenu();       // Đóng menu lại ngay lập tức
        if (openProfile) openProfile();   // Mở dialog thông tin cá nhân
    }

    function handleLogoutClick() {
        if (closeMenu) closeMenu();       // Đóng menu lại ngay lập tức
        if (openLogout) openLogout();     // Mở dialog xác nhận đăng xuất
    }

    return (
        <div className="flex flex-col justify-center bg-white p-4 gap-2 w-56 rounded-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-[14px]">
            <h3 className="border-b border-slate-100 pb-2.5 font-bold text-slate-800 text-center truncate">{userName}</h3>
            <ul className="list-none flex flex-col gap-0.5">
                <li 
                    onClick={handleProfileClick} 
                    className="py-2 px-3 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer rounded-md transition-colors"
                >
                    Thông tin cá nhân
                </li>
                <li 
                    onClick={() => { if (closeMenu) closeMenu(); }}
                    className="py-2 px-3 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer rounded-md transition-colors"
                >
                    Cài đặt nhanh
                </li>
                <li 
                    onClick={handleLogoutClick} 
                    className="py-2 px-3 hover:bg-slate-50 text-red-500 font-semibold cursor-pointer rounded-md transition-colors"
                >
                    Đăng xuất
                </li>
            </ul>
        </div>
    );
}