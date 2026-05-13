import Profile from "./Profile";
import { useRef } from "react";
import DialogWindow from "./DialogWindow";
import ConfirmLogout from "./ConfirmLogout";
export default function Menu({userName,email,avatarUrl}){
    const dialogRef=useRef();
    const confirmLogoutRef=useRef();
    function Logout(){
      confirmLogoutRef.current.open();
    }
    function cancleLogout(){
        confirmLogoutRef.current.close();
    }
    function prof(){
        dialogRef.current.open();
    }
    return (
        <>
        <DialogWindow dialogForm={<ConfirmLogout cancleLogout={cancleLogout} />} ref={confirmLogoutRef} position={`m-auto`}/>
        <DialogWindow dialogForm={<Profile avatarUrl={avatarUrl} userName={userName} email={email} />} ref={dialogRef} position={`m-auto`}/>
        <div className="flex flex-col justify-center bg-white p-5 gap-3">
            <h3 className="border-b border-gray-500 pb-4 font-semibold text-xl text-center">{userName}</h3>
            <ul className="style-none ">
                <li onClick={prof} className="py-1 hover:text-blue-500 text-gray-800 cursor-pointer">Thông tin cá nhân</li>
                <li className="py-1 hover:text-blue-500 text-gray-800 cursor-pointer">Cài đặt</li>
                <li onClick={Logout} className="py-1 hover:text-blue-500 text-gray-800 cursor-pointer">Đăng xuất</li>
            </ul>
        </div>
        </>
        );

}