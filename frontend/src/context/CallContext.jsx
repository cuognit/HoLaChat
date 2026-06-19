/**
 * File: CallContext.jsx
 * Chức năng: Quản lý state toàn cục (Context API) của ứng dụng.
 */
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { getActiveCall, acceptCall, rejectCall, endCall, cancelCall, leaveCall } from "../api/callApi";
import { subscribeToDestination, getChatSocketClient } from "../services/chatSocket";
import { useChat } from "../hooks/useChat";

const CallContext = createContext(null);

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
    const { currentUser } = useChat();
    const user = currentUser;
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [callingState, setCallingState] = useState(null);
    const subscriptionRef = useRef(null);

    // Xử lý STOMP Events
    useEffect(() => {
        if (!user) return;
        
        const client = getChatSocketClient();
        const subscribe = () => {
            if (subscriptionRef.current) return;
            subscriptionRef.current = subscribeToDestination(`/topic/user/${user.id}/call`, (event) => {
                handleCallEvent(event);
            });
        };

        if (client.connected) {
            subscribe();
        } else {
            // Wait for connect
            const interval = setInterval(() => {
                if (getChatSocketClient().connected) {
                    subscribe();
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, [user]);

    // Khôi phục State khi refresh trang
    useEffect(() => {
        if (!user) return;

        const restoreState = async () => {
            try {
                const res = await getActiveCall();
                if (!res) return;

                if (res.status === "ACTIVE") {
                    setActiveCall(res);
                } else if (res.status === "RINGING") {
                    if (res.isCaller) {
                        setCallingState(res);
                    } else {
                        setIncomingCall({
                            sessionId: res.sessionId,
                            callerInfo: res.otherPartyInfo,
                            roomId: res.roomId, // might be missing if API doesn't return, but okay
                        });
                    }
                }
            } catch (err) {
                console.error("Lỗi khi restore call state", err);
            }
        };
        restoreState();
    }, [user]);

    // Xử lý trước khi tắt tab
    useEffect(() => {
        const handleBeforeUnload = () => {
            const currentSessionId = activeCall?.sessionId || callingState?.sessionId || incomingCall?.sessionId;
            if (currentSessionId) {
                navigator.sendBeacon(`/api/calls/${currentSessionId}/end`);
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [activeCall, callingState, incomingCall]);

    const handleCallEvent = (event) => {
        console.log("Receive call event:", event);
        switch (event.type) {
            case "CALL_REQUEST":
                setIncomingCall(event);
                break;
            case "CALL_ACCEPTED":
                setCallingState((prev) => {
                    if (prev && prev.sessionId === event.sessionId) {
                        setActiveCall({
                            ...prev,
                            status: "ACTIVE",
                            livekitToken: event.livekitToken || prev.livekitToken, // Usually the caller gets token upon accepted? No, caller generated token on request, but maybe callee sends it. Actually caller token is already in CallingState, but backend might send a new one. Wait, caller already has token? Let's check backend.
                        });
                        return null;
                    }
                    return prev;
                });
                setIncomingCall(null);
                break;
            case "CALL_REJECTED":
            case "CALL_CANCELLED":
            case "CALL_MISSED":
            case "CALL_ENDED":
                setIncomingCall(null);
                setCallingState(null);
                setActiveCall(null);
                break;
            default:
                break;
        }
    };

    const handleAccept = async () => {
        if (!incomingCall) return;
        const currentCall = incomingCall;
        setIncomingCall(null);
        try {
            const res = await acceptCall(currentCall.sessionId);
            setActiveCall(res);
        } catch (err) {
            console.error("Lỗi accept", err);
        }
    };

    const handleReject = async () => {
        if (!incomingCall) return;
        const currentCall = incomingCall;
        setIncomingCall(null);
        try {
            await rejectCall(currentCall.sessionId);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEndCall = async () => {
        const sessionId = activeCall?.sessionId;
        if (!sessionId) return;
        setActiveCall(null);
        try {
            await leaveCall(sessionId);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCancelCall = async () => {
        const sessionId = callingState?.sessionId;
        if (!sessionId) return;
        setCallingState(null);
        try {
            await cancelCall(sessionId);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <CallContext.Provider
            value={{
                incomingCall,
                activeCall,
                setActiveCall,
                callingState,
                setCallingState,
                handleAccept,
                handleReject,
                handleEndCall,
                handleCancelCall,
            }}
        >
            {children}
        </CallContext.Provider>
    );
};
