import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useImperativeHandle } from 'react';

import { forwardRef } from 'react';
import axios from 'axios';
import {toast} from 'sonner';
import { useNavigate } from 'react-router-dom';

const OtpInput = ({ length = 6, onComplete ,red,green,resetRedGeen}) => {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);
  const hasSubmit = useRef(false);
  
  // Xử lý khi gõ vào 1 ô
  const handleChange = (element, index) => {
    const value = element.value;
    
    // Chỉ cho phép nhập số
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Lấy ký tự cuối cùng (phòng trường hợp người dùng chọn text rồi gõ đè lên)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Tự động nhảy sang ô tiếp theo nếu có nhập số
    if (value !== "" && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
    hasSubmit.current = false;
    
    
  };

  // Xử lý khi nhấn nút Backspace (Xóa)
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      // Nếu ô hiện tại đang trống và không phải ô đầu tiên -> lùi lại ô trước đó
      if (otp[index] === "" && index > 0) {
        inputRefs.current[index - 1].focus();
      }
      
      // Xóa dữ liệu ô hiện tại nếu có
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  // Xử lý khi người dùng Dán (Paste) một chuỗi số
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, length).split("");
    
    // Nếu có chứa chữ cái thì từ chối không cho dán
    if (pastedData.some(isNaN)) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus vào ô tiếp theo sau khi dán xong (hoặc ô cuối cùng)
    const focusIndex = pastedData.length < length ? pastedData.length : length - 1;
    inputRefs.current[focusIndex].focus();
  };

  // Kích hoạt callback khi điền đủ 6 số
  useEffect(() => {
    if (otp.every(char => char !== "")&& !hasSubmit.current) {
      onComplete(otp.join(""));
      hasSubmit.current = true;
    }
  }, [otp, onComplete]);
  

  return (
    <div className="flex gap-2 justify-center sm:gap-3">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric" // Hiển thị bàn phím số trên điện thoại
          maxLength={1}
          ref={(ref) => inputRefs.current[index] = ref}
          value={data}
          onChange={(e) => {handleChange(e.target, index),resetRedGeen()}}
          onKeyDown={(e) => {handleKeyDown(e, index),resetRedGeen()}}
          onPaste={handlePaste,resetRedGeen}
          onClick={resetRedGeen}
          className={`${red && `border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200`} ${green && `border-green-500 ring-2 ring-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200`}
            w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold text-gray-800 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all`}
        />
      ))}
    </div>
  );
};

const  OutInput = forwardRef( (props, ref) => {  
  function setFasle(){
     setRed(false);
     setGreen(false);
  }

    const dialogRef=useRef();
  useImperativeHandle(ref, () => {
    return {
      open() {
        dialogRef.current.showModal();
        },
        close() {
          dialogRef.current.close();
        },
      };
    });
    const navi = useNavigate();
  // Hàm này được gọi tự động khi nhập đủ 6 số
    const [red,setRed] = useState(false);
    const [green,setGreen] = useState(false);
  const handleOtpComplete = (otpCode) => {
       setTimeout(() => {
      axios.post("http://localhost:8080/api/auth/verify-otp", {
       otp: otpCode,
       email: props.email
      })
  
    .then(res => {
      console.log(res.data);
      toast.success(res.data.message);
      
      setGreen(true);
      setTimeout(()=>{
      dialogRef.current.close();
      navi("/login");
      },2000)
    })
    .catch (error => {
      console.error(error.response.data);
      toast.warning(error.response.data.message);
      setRed(true);
    });
      }, 1000);
          
  };

  return (
    <dialog ref={dialogRef} className='m-auto overflow-hidden rounded-2xl transition-opacity duration-600 ease-in-out opacity-100 '> 
    <div  className="flex items-center justify-center p-4 font-sans bg-gray-100 h-full w-full">
      <div className="w-full max-w-100 rounded-xl shadow-md p-8 text-center">
        
        <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác thực OTP</h2>
        <p className="text-sm text-gray-600 mb-8">
          Vui lòng nhập mã 6 số đã được gửi đến <span className="font-medium text-blue-500">{props.email}</span>.
        </p>

        {/* GỌI COMPONENT OTP VÀO ĐÂY */}
        <OtpInput length={6} onComplete={handleOtpComplete} red={red} green={green} resetRedGeen={setFasle} />
        <div className='flex flex-col items-center justify-center mt-4'>

        {/* <button
         onClick={handleOtpComplete}
         className='p-3 rounded-2xl bg-blue-400 text-white text-sm font-bold hover:bg-blue-500 transition-colors duration-300 ease-in-out'>Xác Thực</button> */}

        { props.time>0 &&
        <p className="text-sm text-gray-600 mt-4"> Gửi lại mã sau <span className="font-medium text-blue-500">{props.time}s</span></p>
        }
        {props.time==0 && 
        <button 
          className="mt-4 text-sm text-gray-500 hover:text-blue-500 transition-colors"
          onClick={() => {{props.sendOtp(); props.timeRemaining();} }}
        >
          Gửi lại mã
        </button>}
        </div>
        
      </div>
    </div>
    </dialog>
    
  );
})
export default OutInput;