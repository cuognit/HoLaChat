import axiosInstance from "./axiosConfig";

export const initiateCall = async (calleeId, roomId) => {
    const res = await axiosInstance.post("/calls", { calleeId, roomId });
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
