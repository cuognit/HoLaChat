package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho CallRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class CallRequest {
    private Long calleeId;
    private Long roomId;
    private String callType = "AUDIO";
}

