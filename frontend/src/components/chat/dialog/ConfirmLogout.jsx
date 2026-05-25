import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../../../api/axiosConfig.js";
import { AuthContext } from '../../../context/AuthContextInstance.js';
import {ChatContext} from '../../../context/chatContextInstance.js';
import { useContext } from "react";
export default function ConfirmLogout({cancleLogout}) {
    const navigate=useNavigate();
    const { setAccessToken } = useContext(AuthContext);
    const { setCurrentUser } = useContext(ChatContext);
   async function handleLogout() {
          try{
            await api.post("auth/logout",{});
            setAccessToken(null);
            setCurrentUser(null);
            navigate("/login");
            toast.success("Đăng xuất thành công!");

        }catch(error){
            toast.error(error.response.data.message);
        }
    }
    return(
       
            <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-center text-blue-500">Xác nhận đăng xuất</h3>
                <p className="text-gray-600 text-center">Bạn có chắc chắn muốn đăng xuất?</p>
                <div className="flex justify-center gap-2 mt-4">
                    <button onClick={cancleLogout} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">Hủy</button>
                    <button onClick={handleLogout} className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 cursor-pointer">Đăng xuất</button>
                </div>
            </div>
    )
}