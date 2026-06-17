import React, { useState, useRef, useEffect} from 'react';
import { Mail, Lock,User } from 'lucide-react';
import OutInput from '../components/auth/OtpInput';
import api from '../api/axiosConfig';
import {toast} from 'sonner';

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
        const [email, setEmail] = useState('');
        const [passWord, setPassword] = useState('');
        const [userName, setUserName] = useState('');
        const OtpInputRef= useRef();
        const [time, setTime] = useState(120);
        const timer = useRef();

        function startTimer() {
            if (timer.current) {
                clearInterval(timer.current);
            }
            const endTime = Date.now() + 120 * 1000;
            timer.current = setInterval(() => {
                const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
                    setTime(remaining);
                    if (remaining === 0) {
                        clearInterval(timer.current); 
                    }
            }, 1000);
           
        } 
        // useEffect(() => {
        //         if(time === 0){
        //             clearInterval(timer.current);
        //         }
                
        //     }, [time]);
        useEffect(() => {
            return () => {
                if (timer.current) {
                clearInterval(timer.current);
                }
            };
            }, []);

        const handleSubmit = (e) => {
            e.preventDefault();

            api.post("/auth/register", {
                email: email,
                passWord: passWord,
                userName: userName
            })
            .then(res => {
                OtpInputRef.current.open();
                api.post("/auth/otp", { email: email })
                    .then(res => {
                        toast.success(res.data.message);
                    })
                    .catch(error => {
                        toast.warning(error.response?.data?.message);
                    });
            })
            .catch(error => {
                toast.warning(error.response?.data?.message);
            });
        };

        const sendOtp = () => {
            api.post("/auth/otp", { email: email })
                .then(res => {
                    toast.success(res.data.message);
                })
                .catch(error => {
                    toast.warning(error.response?.data?.message);
                });
            setTime(120);
        };
        const enableSubmit = email && passWord && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


    return (
        <>  
            
            <OutInput ref={OtpInputRef} email={email} sendOtp={sendOtp} timeRemaining={startTimer} time={time}/>
            <div className="flex flex-col items-center justify-center h-screen bg-blue-100">
            <h1 className="text-blue-500 font-bold text-3xl md:text-5xl mb-10">HoLa</h1>
            {/* Form Container */}
                <div className="w-full max-w-sm mx-4 md:mx-auto bg-white rounded-xl shadow-sm overflow-hidden">
                    
                    {/* Header */}
                    <div className="text-center py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Đăng ký tài khoản</h2>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="p-5 md:p-8">
                     {/* Input username */}
                     <div className="flex items-center gap-3 py-3 border-b border-gray-100 focus-within:border-blue-400 transition-colors ">
                        <User className="w-5 h-5 text-gray-500 shrink-0" />

                        {/* Ô nhập email */}
                        <input
                        name='userName'
                        type="text"
                        placeholder="Họ tên của bạn"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                        required
                        />
                    </div>
                    {/* Input Email */}
                    <div className="flex items-center gap-3 py-3 border-b border-gray-100 focus-within:border-blue-400 transition-colors ">
                        <Mail className="w-5 h-5 text-gray-500 shrink-0" />

                        {/* Ô nhập email */}
                        <input
                        name='email'
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
                        name='passWord'
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu"
                        value={passWord}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                        required
                        />
                      <div className='flex items-center justify-end gap-2 mt-1 border-l-2 ps-2 pt-1 pb-1 border-gray-300'>
                         <input 
                            type="checkbox" 
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                            className=" cursor-pointer
                                h-4 w-4 appearance-none border border-gray-300 rounded
                                checked:bg-blue-500 checked:border-blue-500
                                checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTYgMTYiIGZpbGw9IndoaXRlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMi4yMDcgNC43OTNsLTUuNzA3IDUuNzA3LTIuNzA3LTIuNzA3LTEuNDE0IDEuNDE0IDQuMTIxIDQuMTIxIDcuMTIxLTcuMTIxeiIvPjwvc3ZnPg==')] 
                                bg-center bg-no-repeat
                            " 
                            />
                            <p className='text-xs text-gray-500 cursor-pointer ' onClick={() => setShowPassword(!showPassword)}>Hiện mật khẩu</p>
                    </div>
                            
                    </div>
                    
                    <p className="text-red-500 text-xs ">
                        {passWord && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[~!@#$%^&*(){}}|"':;,.?`])[A-Za-z\d~!@#$%^&*(){}}|"':;,.?`]{8,}$/.test(passWord) ? "Mật khẩu phải chứa (8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt)" : ""}
                    </p>
                    
                    {/* Nút Đăng ký */}
                    <button
                        onClick={startTimer}
                        disabled={!enableSubmit}
                        type="submit"
                        className="cursor-pointer mt-8 disabled:opacity-50 w-full bg-[#0896f5] hover:bg-[#5bb4f1] text-white font-medium py-3.5 rounded-md transition-colors"
                    >
                        Đăng ký
                    </button>

                   <a href="/login" className="text-blue-500 hover:text-blue-700 text-sm font-medium text-center block mt-4">
                        Đã có tài khoản? Đăng nhập tại đây
                    </a>

                    </form>
                </div>
           </div>   
                    
        </>
    );

}