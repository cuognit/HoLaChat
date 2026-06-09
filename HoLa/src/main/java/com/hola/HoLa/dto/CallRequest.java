package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class CallRequest {
    private Long calleeId;
    private Long roomId;
    private String callType = "AUDIO";
}
