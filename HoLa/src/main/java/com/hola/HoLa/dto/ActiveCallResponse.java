package com.hola.HoLa.dto;

import com.hola.HoLa.model.CallStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ActiveCallResponse {
    private Long sessionId;
    private CallStatus status;
    private String roomName;
    private String livekitToken;
    @com.fasterxml.jackson.annotation.JsonProperty("isCaller")
    private boolean isCaller;
    private UserDTO otherPartyInfo;
    private String callType;
}
