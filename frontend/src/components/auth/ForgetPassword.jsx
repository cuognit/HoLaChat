import React, { useState } from 'react';
import { Mail, Lock, KeyRound, CheckCircle2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function ForgetPassword () {
  
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Handle OTP Input
  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    // Focus next input
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

//   const resetFlow = () => {
//     setStep(1);
//     setEmail('');
//     setOtp(['', '', '', '', '', '']);
//     setNewPassword('');
//     setConfirmPassword('');
//     setError('');
//     setIsLoading(false);
//   };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API calls
    setTimeout(() => {
      setIsLoading(false);
      if (step === 1) {
        if (!email.includes('@')) {
          setError('Vui lòng nhập email hợp lệ');
          return;
        }
        setStep(2);
      } else if (step === 2) {
        if (otp.join('').length < 6) {
          setError('Vui lòng nhập đủ 6 số OTP');
          return;
        }
        setStep(3);
      } else if (step === 3) {
        if (newPassword.length < 6) {
          setError('Mật khẩu phải có ít nhất 6 ký tự');
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp');
          return;
        }
        setStep(4);
      }
    }, 1000);
  };

  return (
   
        
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-all transform animate-in fade-in zoom-in duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-center items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">
                {step === 1 && "Khôi phục mật khẩu"}
                {step === 2 && "Xác thực mã OTP"}
                {step === 3 && "Thiết lập mật khẩu mới"}
                {step === 4 && "Hoàn tất"}
              </h2>
              
            </div>

            {/* Body */}
            <div className="p-8">
              {/* Progress Indicator */}
              <div className="flex justify-center mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                      <div className={`w-12 h-1 mx-2 rounded transition-colors ${
                        step > s ? 'bg-blue-600' : 'bg-slate-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleNextStep}>
                {/* Step 1: Email Input */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="inline-flex p-3 bg-blue-50 rounded-full mb-3">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-slate-600 text-sm">
                        Nhập địa chỉ email của bạn để nhận mã xác thực OTP.
                      </p>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-4 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: OTP Input */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex p-3 bg-amber-50 rounded-full mb-3">
                        <KeyRound className="w-6 h-6 text-amber-600" />
                      </div>
                      <p className="text-slate-600 text-sm">
                        Mã OTP đã được gửi đến <span className="font-semibold text-blue-600">{email}</span>. Vui lòng kiểm tra hộp thư.
                      </p>
                    </div>
                    <div className="flex justify-between gap-2">
                      {otp.map((data, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength="1"
                          className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          value={data}
                          onChange={(e) => handleOtpChange(e.target, index)}
                          onFocus={(e) => e.target.select()}
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      <button type="button" className="text-sm text-blue-600 hover:underline font-medium">
                        Gửi lại mã (60s)
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="inline-flex p-3 bg-emerald-50 rounded-full mb-3">
                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-slate-600 text-sm">
                        Mật khẩu mới của bạn phải khác mật khẩu đã sử dụng trước đó.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Mật khẩu mới"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          placeholder="Xác nhận mật khẩu mới"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Success Message */}
                {step === 4 && (
                  <div className="py-6 text-center space-y-4">
                    <div className="inline-flex p-4 bg-emerald-100 rounded-full animate-bounce">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-800">Thành công!</h3>
                      <p className="text-slate-600">
                        Mật khẩu của bạn đã được thay đổi thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => window.location.href="/login"}
                      className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      Quay lại Đăng nhập
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-red-600"></div>
                    {error}
                  </div>
                )}

                {/* Footer Buttons */}
                {step < 4 && (
                  <div className="mt-8 flex gap-3">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={() => setStep(step - 1)}
                        className="cursor-pointer flex-1 py-3 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        Quay lại
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`
                       cursor-pointer flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                        isLoading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          {step === 1 && "Tiếp tục"}
                          {step === 2 && "Xác minh"}
                          {step === 3 && "Cập nhật mật khẩu"}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        
    
  );
};