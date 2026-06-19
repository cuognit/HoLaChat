package com.hola.HoLa.dto;

import com.hola.HoLa.model.CallStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
/**
 * Lớp DTO (Data Transfer Object) cho CallResponse.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class CallResponse {
    private Long sessionId;
    private CallStatus status;
    private String livekitToken;
    private String roomName;
    private UserDTO callerInfo;
    private String callType;
}

