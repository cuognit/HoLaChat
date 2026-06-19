package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho PrivateMessageRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class PrivateMessageRequest {
    private Long roomId;
    private Long senderId;
    private Long receiverId;
    private String content;
    private String messageType; // TEXT, IMAGE - optional, defaults to TEXT
    private Long replyToId;
    private Boolean forwarded = false;
}

