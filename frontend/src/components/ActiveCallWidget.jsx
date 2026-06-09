import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { useCall } from "../context/CallContext";
import { LiveKitRoom, useRoomContext, useLocalParticipant, RoomAudioRenderer } from "@livekit/components-react";
import { PhoneOff, Mic, MicOff } from "lucide-react";
import "@livekit/components-styles";
import { useWebAudioRingtone } from "../hooks/useWebAudioRingtone";

const CallControls = () => {
    const { handleEndCall } = useCall();
    const { localParticipant } = useLocalParticipant();
    const room = useRoomContext();
    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = async () => {
        if (localParticipant) {
            if (isMuted) {
                await localParticipant.setMicrophoneEnabled(true);
                setIsMuted(false);
            } else {
                await localParticipant.setMicrophoneEnabled(false);
                setIsMuted(true);
            }
        }
    };

    return (
        <div className="flex items-center justify-center space-x-4 mt-4">
            <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all shadow-sm cursor-pointer ${
                    isMuted ? "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100"
                }`}
                title={isMuted ? "Bật mic" : "Tắt mic"}
            >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button
                onClick={() => {
                    if (room) {
                        room.disconnect();
                    }
                    handleEndCall();
                }}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/40 cursor-pointer"
                title="Kết thúc cuộc gọi"
            >
                <PhoneOff size={22} />
            </button>
        </div>
    );
};

export const ActiveCallWidget = () => {
    const { activeCall, callingState, handleCancelCall } = useCall();
    const [duration, setDuration] = useState(0);
    const nodeRef = useRef(null);

    // Kích hoạt âm thanh tút tút cho người gọi (chỉ khi đang "Calling" và chưa "Active")
    const isDialing = callingState && !activeCall;
    useWebAudioRingtone(!!isDialing, 'caller');

    useEffect(() => {
        let interval;
        if (activeCall?.status === "ACTIVE") {
            setDuration(0);
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeCall?.sessionId, activeCall?.status]);

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const serverUrl = import.meta.env.VITE_LIVEKIT_URL;

    // Hiển thị cho trường hợp "Đang gọi..." (Calling)
    if (callingState && !activeCall) {
        const caller = callingState.otherPartyInfo;
        return (
            <div className="fixed bottom-6 right-6 z-[9998]">
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 w-64 border-2 border-blue-50 flex flex-col items-center">
                    <div className="relative mb-5">
                        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
                        <img
                            src={caller?.avatarUrl || "https://res.cloudinary.com/dgykchz2q/image/upload/v1741160350/default-avatar.png"}
                            alt="avatar"
                            className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-white relative z-10"
                        />
                    </div>
                    <h3 className="font-bold text-blue-900 text-lg truncate w-full text-center">
                        {caller?.userName || "Ai đó"}
                    </h3>
                    <p className="text-sm font-medium text-blue-500 mb-6 mt-1">Đang gọi...</p>
                    <button
                        onClick={handleCancelCall}
                        className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/40 cursor-pointer"
                        title="Huỷ gọi"
                    >
                        <PhoneOff size={22} />
                    </button>
                </div>
            </div>
        );
    }

    if (!activeCall) return null;

    const caller = activeCall.otherPartyInfo || activeCall.callerInfo;

    return (
        <Draggable bounds="parent" nodeRef={nodeRef}>
            <div ref={nodeRef} className="fixed top-24 right-6 z-[9998] cursor-move">
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.16)] p-6 w-[280px] border-2 border-blue-100 flex flex-col items-center bg-gradient-to-b from-white to-blue-50/30">
                    <div className="relative mb-4 pointer-events-none">
                        <img
                            src={caller?.avatarUrl || "/avatar.jpg"}
                            alt="avatar"
                            className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
                            onError={(e) => { e.target.src = "/avatar.jpg" }}
                        />
                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <h3 className="font-bold text-blue-950 text-xl truncate w-full text-center pointer-events-none">
                        {caller?.userName || "Ai đó"}
                    </h3>
                    <div className="bg-blue-100/50 px-4 py-1.5 rounded-full mt-2 pointer-events-none border border-blue-100">
                        <p className="text-sm font-semibold text-blue-600 tracking-wider">
                            {formatDuration(duration)}
                        </p>
                    </div>

                    <div className="w-full mt-2 cursor-auto">
                        <LiveKitRoom
                            video={false}
                            audio={true}
                            token={activeCall.livekitToken}
                            serverUrl={serverUrl}
                            connect={true}
                            onDisconnected={() => console.log('Disconnected from LiveKit')}
                        >
                            <RoomAudioRenderer />
                            <CallControls />
                        </LiveKitRoom>
                    </div>
                </div>
            </div>
        </Draggable>
    );
};
