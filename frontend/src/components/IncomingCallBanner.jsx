import React, { useEffect, useRef } from "react";
import { useCall } from "../context/CallContext";
import { Phone, PhoneOff } from "lucide-react";

export const IncomingCallBanner = () => {
    const { incomingCall, handleAccept, handleReject } = useCall();
    const audioRef = useRef(null);

    useEffect(() => {
        if (incomingCall) {
            // Phát âm thanh file MP3 Nokia
            if (audioRef.current) {
                audioRef.current.play().catch(console.error);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    }, [incomingCall]);

    if (!incomingCall) return null;

    const caller = incomingCall.callerInfo;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.16)] p-5 flex items-center space-x-6 border-2 border-blue-100 w-[90%] max-w-sm animate-bounce-short bg-gradient-to-r from-white to-blue-50/50">
            <audio ref={audioRef} src="/nhac_chuong_nokia_chuan-www_tiengdong_com.mp3" loop />
            
            <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                <img
                    src={caller?.avatarUrl || "/avatar.jpg"}
                    alt="avatar"
                    className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white relative z-10"
                    onError={(e) => { e.target.src = "/avatar.jpg" }}
                />
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-blue-950 truncate">
                    {caller?.userName || "Ai đó"}
                </p>
                <p className="text-sm font-medium text-blue-500 mt-0.5">
                    Đang gọi thoại...
                </p>
            </div>

            <div className="flex items-center space-x-3">
                <button
                    onClick={handleReject}
                    className="p-3.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-all shadow-sm border border-red-100 cursor-pointer"
                    title="Từ chối"
                >
                    <PhoneOff size={22} />
                </button>
                <button
                    onClick={handleAccept}
                    className="p-3.5 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all shadow-lg hover:shadow-green-500/40 animate-pulse cursor-pointer"
                    title="Nghe"
                >
                    <Phone size={22} className="fill-current" />
                </button>
            </div>
        </div>
    );
};
