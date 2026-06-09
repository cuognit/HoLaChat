package com.hola.HoLa.dto;

import com.hola.HoLa.model.CallStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CallResponse {
    private Long sessionId;
    private CallStatus status;
    private String livekitToken;
    private String roomName;
    private UserDTO callerInfo;
    private String callType;
}
