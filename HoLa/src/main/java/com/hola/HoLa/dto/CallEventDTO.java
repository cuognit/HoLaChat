package com.hola.HoLa.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
/**
 * Lớp DTO (Data Transfer Object) cho CallEventDTO.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class CallEventDTO {
    private String type; // CALL_REQUEST, CALL_ACCEPTED, CALL_REJECTED, CALL_CANCELLED, CALL_ENDED, CALL_MISSED
    private Long sessionId;
    private Long roomId;
    private String livekitToken;
    private String roomName;
    private UserDTO callerInfo; // for CALL_REQUEST
    private String callType;
}

