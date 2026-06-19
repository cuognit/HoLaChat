package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho RecallMessageRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class RecallMessageRequest {
    private Long messageId;
    private Long userId;
}

