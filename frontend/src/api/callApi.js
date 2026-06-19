/**
 * File: callApi.js
 * Chức năng: Cấu hình và các hàm gọi API giao tiếp với Backend.
 */
import axiosInstance from "./axiosConfig";

export const initiateCall = async (calleeId, roomId, callType = "AUDIO") => {
    const res = await axiosInstance.post("/calls", { calleeId, roomId, callType });
    return res.data;
};

export const acceptCall = async (sessionId) => {
    const res = await axiosInstance.post(`/calls/${sessionId}/accept`);
    return res.data;
};

export const rejectCall = async (sessionId) => {
    const res = await axiosInstance.post(`/calls/${sessionId}/reject`);
    return res.data;
};

export const cancelCall = async (sessionId) => {
    const res = await axiosInstance.post(`/calls/${sessionId}/cancel`);
    return res.data;
};

export const endCall = async (sessionId) => {
    const res = await axiosInstance.post(`/calls/${sessionId}/end`);
    return res.data;
};

export const getActiveCall = async () => {
    const res = await axiosInstance.get("/calls/active");
    return res.data;
};

export const leaveCall = async (sessionId) => {
    const res = await axiosInstance.post(`/calls/${sessionId}/leave`);
    return res.data;
};

export const getActiveCallByRoom = async (roomId) => {
    const res = await axiosInstance.get(`/calls/room/${roomId}/active`);
    return res.data;
};
