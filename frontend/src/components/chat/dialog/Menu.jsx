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
        <div className="flex flex-col justify-center bg-white p-5 gap-3">
            <h3 className="border-b border-gray-500 pb-4 font-semibold text-xl text-center">{userName}</h3>
            <ul className="style-none ">
                <li onClick={handleProfileClick} className="py-1 hover:text-blue-500 text-gray-800 cursor-pointer">
                    Thông tin cá nhân
                </li>
                <li className="py-1 hover:text-blue-500 text-gray-800 cursor-pointer">
                    Cài đặt
                </li>
                <li onClick={handleLogoutClick} className="py-1 hover:text-blue-500 text-gray-800 cursor-pointer">
                    Đăng xuất
                </li>
            </ul>
        </div>
    );
}