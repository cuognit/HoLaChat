import { useContext, useState ,useRef} from 'react';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { AuthContext } from '../context/AuthContextInstance.js';
import { useNavigate } from 'react-router-dom';
import DialogWindow from '../components/chat/dialog/DialogWindow.jsx';
import api, { setAuthToken } from '../api/axiosConfig';
import ForgetPassword from '../components/auth/ForgetPassword.jsx';
export default function LoginPage() {
    const {setAccessToken} = useContext(AuthContext);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const enableSubmit = email && password && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ;
    const handleSubmit = (e) => {
        e.preventDefault();
        api.post("auth/login",{
            email: email,
            passWord: password
        })
        .then(res => {
            toast.success(res.data.message);
            setAccessToken(res.data.data);
            setAuthToken(res.data.data);
            
            navigate("/");
        })
        .catch (error => {
            console.error(error.response.data);
            toast.warning(error.response.data.message);
        });
    };
    const forgetPasswordRef = useRef();
    const handleOpenForgetPassword = () => {
        forgetPasswordRef.current.open();
    };
    return (
        <>
            <DialogWindow ref={forgetPasswordRef} dialogForm={<ForgetPassword/>} position="m-auto rounded-2xl"/>
           <div class="flex flex-col items-center justify-center h-screen bg-blue-100">
            <h1 class="text-blue-500 font-bold text-5xl mb-10">HoLa</h1>
            {/* Form Container */}
                <div className="w-full max-w-100 bg-white rounded-xl shadow-sm overflow-hidden">
                    
                    {/* Header */}
                    <div className="text-center py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Đăng nhập với mật khẩu</h2>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-8">
                    
                    {/* Input Email */}
                    <div className="flex items-center gap-3 py-3 border-b border-gray-100 focus-within:border-blue-400 transition-colors ">
                        <Mail className="w-5 h-5 text-gray-500 shrink-0" />

                        {/* Ô nhập email */}
                        <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                        className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                        required
                        />
                    </div>
                    <p className="text-red-500 text-xs">
                        {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Vui lòng nhập email hợp lệ" : ""}
                    </p>

                    {/* Input Mật khẩu */}
                    <div className="flex items-center gap-3 py-3 border-b border-gray-100 focus-within:border-blue-400 transition-colors">
                        <Lock className="w-5 h-5 text-gray-500 shrink-0" />
                        <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                        required
                        />
                       <div className='flex items-center justify-end gap-2 mt-1 border-l-2 ps-2 pt-1 pb-1 border-gray-300'>
                         <input 
                            type="checkbox" 
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                            class=" cursor-pointer
                                h-4 w-4 appearance-none border border-gray-300 rounded
                                checked:bg-blue-500 checked:border-blue-500
                                checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9IndoaXRlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMi4yMDcgNC43OTNsLTUuNzA3IDUuNzA3LTIuNzA3LTIuNzA3LTEuNDE0IDEuNDE0IDQuMTIxIDQuMTIxIDcuMTIxLTcuMTIxeiIvPjwvc3ZnPg==')] 
                                bg-center bg-no-repeat
                            " 
                            />
                            <p className='text-xs text-gray-500 cursor-pointer ' onClick={() => setShowPassword(!showPassword)}>Hiện mật khẩu</p>
                    </div>
                    </div>
                    {/* <p className="text-red-500 text-xs ">
                        {password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password) ? "Mật khẩu phải chứa (8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt)" : ""}
                    </p> */}

                    {/* Nút Đăng nhập */}
                    <button
                        disabled={!enableSubmit}
                        type="submit"
                        className="cursor-pointer mt-8 disabled:opacity-50 w-full bg-[#0896f5] hover:bg-[#5bb4f1] text-white font-medium py-3.5 rounded-md transition-colors"
                    >
                        Đăng nhập
                    </button>

                    {/* Quên mật khẩu */}
                    <div className="text-center mt-6">
                        <button 
                        type="button"
                        onClick={() => {handleOpenForgetPassword();}} 
                        className="cursor-pointer text-gray-400 hover:text-gray-800 text-sm font-medium"
                        >
                        Quên mật khẩu?
                        </button>
                    </div>
                    <a href="/register" className="text-blue-500 cursor-pointer hover:text-blue-700 text-sm font-medium text-center block mt-4">
                        Đăng ký tài khoản
                    </a>
                    </form>
                </div>
           </div>
        </>
    );
}