package com.hola.HoLa.model;

/**
 * Enum định nghĩa các trạng thái của cuộc gọi (Đang đổ chuông, Đang nghe, Bị từ chối, v.v.).
 */
public enum CallStatus {
    RINGING,
    ACTIVE,
    REJECTED,
    MISSED,
    CANCELLED,
    ENDED
}
