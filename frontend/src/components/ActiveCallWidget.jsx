import React, { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { useCall } from "../context/CallContext";
import { LiveKitRoom, useRoomContext, useLocalParticipant, RoomAudioRenderer, VideoConference } from "@livekit/components-react";
import { PhoneOff, Mic, MicOff, Maximize2, Minimize2, Video, Minus } from "lucide-react";
import "@livekit/components-styles";
import { useWebAudioRingtone } from "../hooks/useWebAudioRingtone";
import { ChatContext } from "../context/chatContextInstance";
import { useContext } from "react";

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
    const { activeCall, callingState, handleCancelCall, handleEndCall } = useCall();
    const { currentUser } = useContext(ChatContext);
    const [duration, setDuration] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(window.innerWidth < 768);
    const [isMinimized, setIsMinimized] = useState(false);
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
        } else {
            setDuration(0);
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

    const currentCall = activeCall || callingState;
    if (!currentCall) return null;

    const caller = currentCall.otherPartyInfo || currentCall.callerInfo;
    const isVideo = currentCall.callType === 'VIDEO';
    const isCalling = callingState && !activeCall;

    const customAvatarStyle = `
        .lk-participant-tile[data-lk-identity="${currentUser?.id}"] .lk-participant-placeholder svg { display: none !important; }
        .lk-participant-tile[data-lk-identity="${currentUser?.id}"] .lk-participant-placeholder {
            background-image: url('${currentUser?.avatarUrl || "/avatar.jpg"}') !important;
            background-size: cover !important;
            background-position: center !important;
            border-radius: inherit;
        }
        .lk-participant-tile[data-lk-identity="${caller?.id}"] .lk-participant-placeholder svg { display: none !important; }
        .lk-participant-tile[data-lk-identity="${caller?.id}"] .lk-participant-placeholder {
            background-image: url('${caller?.avatarUrl || "/avatar.jpg"}') !important;
            background-size: cover !important;
            background-position: center !important;
            border-radius: inherit;
        }
    `;

    // Hiển thị cho trường hợp "Đang gọi..." (Calling) AUDIO
    if (isCalling && !isVideo) {
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

    const defaultSize = isVideo 
        ? { width: Math.min(640, window.innerWidth), height: Math.min(480, window.innerHeight) } 
        : { width: Math.min(320, window.innerWidth - 40), height: Math.min(420, window.innerHeight - 80) };
    
    const defaultPosition = { 
        x: Math.max(0, (window.innerWidth - defaultSize.width) / 2), 
        y: Math.max(0, (window.innerHeight - defaultSize.height) / 2) 
    };

    if (isVideo) {
        return (
            <Rnd
                default={{
                    x: isFullScreen ? 0 : defaultPosition.x,
                    y: isFullScreen ? 0 : defaultPosition.y,
                    width: isFullScreen ? window.innerWidth : defaultSize.width,
                    height: isFullScreen ? window.innerHeight : defaultSize.height,
                }}
                position={isFullScreen ? { x: 0, y: 0 } : undefined}
                size={isFullScreen ? { width: window.innerWidth, height: window.innerHeight } : isMinimized ? { width: Math.min(300, window.innerWidth - 20), height: 72 } : undefined}
                disableDragging={isFullScreen}
                enableResizing={!isFullScreen && !isMinimized}
                minWidth={isMinimized ? Math.min(300, window.innerWidth - 20) : Math.min(320, window.innerWidth)}
                minHeight={isMinimized ? 72 : Math.min(400, window.innerHeight)}
                bounds="window"
                className={`z-[9999] ${isFullScreen ? 'fixed inset-0' : 'fixed shadow-2xl rounded-2xl overflow-hidden border border-gray-200'} bg-black`}
                dragHandleClassName="drag-header"
            >
                <style>{customAvatarStyle}</style>
                <div className="w-full h-full flex flex-col relative group">
                    {isMinimized ? (
                        <div className="absolute inset-0 z-20 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between px-4 cursor-move drag-header border border-blue-400 shadow-blue-500/30 shadow-lg" style={{ borderRadius: 'inherit' }}>
                            <div className="flex items-center gap-3">
                                <div className="relative pointer-events-none">
                                    <img src={caller?.avatarUrl || "/avatar.jpg"} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-blue-300" onError={(e) => { e.target.src = "/avatar.jpg" }} />
                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-blue-600 animate-pulse"></div>
                                </div>
                                <div className="flex flex-col text-white cursor-auto">
                                    <span className="font-semibold text-sm truncate max-w-[100px] drop-shadow-sm">{caller?.userName || "Video Call"}</span>
                                    <span className="text-xs text-blue-100 font-mono drop-shadow-sm">{formatDuration(duration)}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 cursor-auto">
                                <button onClick={() => setIsMinimized(false)} className="p-2 text-white hover:text-blue-400 bg-white/10 hover:bg-white/20 transition-colors rounded-full cursor-pointer" title="Khôi phục">
                                    <Maximize2 size={16}/>
                                </button>
                                <button onClick={() => { if (activeCall) handleEndCall(); else if (callingState) handleCancelCall(); }} className="p-2 bg-red-500 text-white hover:bg-red-600 transition-colors rounded-full cursor-pointer" title="Kết thúc">
                                    <PhoneOff size={16}/>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="drag-header flex-none w-full h-8 bg-blue-600 border-b border-blue-700 z-10 flex items-center justify-between px-4 cursor-move shadow-md">
                            <div className="text-white font-medium flex items-center gap-2 drop-shadow-sm">
                                <Video size={16} />
                                <span className="text-sm truncate max-w-[200px]">{caller?.userName || "Ai đó"}</span>
                            </div>
                            <div className="flex items-center gap-3 cursor-auto">
                                <div className="bg-black/20 border border-white/10 px-2 py-0.5 rounded text-blue-50 text-xs font-mono drop-shadow-sm">
                                    {formatDuration(duration)}
                                </div>
                                <button 
                                    onClick={() => setIsMinimized(true)}
                                    className="text-white hover:text-blue-400 transition-colors cursor-pointer"
                                    title="Thu nhỏ thành thanh nổi"
                                >
                                    <Minus size={20} />
                                </button>
                                <button 
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="text-white hover:text-blue-400 transition-colors cursor-pointer"
                                    title={isFullScreen ? "Thu nhỏ" : "Phóng to"}
                                >
                                    {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={isMinimized ? "hidden" : "w-full flex-1 relative overflow-hidden"}>
                        <LiveKitRoom
                            video={true}
                            audio={true}
                            token={currentCall.livekitToken}
                            serverUrl={serverUrl}
                            connect={true}
                            onDisconnected={() => {
                                if (activeCall) handleEndCall();
                                else if (callingState) handleCancelCall();
                            }}
                            className="w-full h-full"
                            data-lk-theme="default"
                        >
                            <VideoConference />
                            <RoomAudioRenderer />
                        </LiveKitRoom>
                    </div>
                </div>
            </Rnd>
        );
    }

    // Giao diện AUDIO
    return (
        <Rnd
            default={{
                x: defaultPosition.x,
                y: defaultPosition.y,
                width: defaultSize.width,
                height: defaultSize.height,
            }}
            minWidth={Math.min(280, window.innerWidth - 40)}
            minHeight={Math.min(360, window.innerHeight - 80)}
            enableResizing={false}
            bounds="window"
            className="z-[9998] cursor-move"
        >
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.16)] p-6 w-full h-full border-2 border-blue-100 flex flex-col items-center bg-gradient-to-b from-white to-blue-50/30">
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
                        token={currentCall.livekitToken}
                        serverUrl={serverUrl}
                        connect={true}
                        onDisconnected={() => console.log('Disconnected from LiveKit')}
                    >
                        <RoomAudioRenderer />
                        <CallControls />
                    </LiveKitRoom>
                </div>
            </div>
        </Rnd>
    );
};
