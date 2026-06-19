package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho TypingRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class TypingRequest {
    private Long roomId;
    private Long userId;
    private String userName;
    private String avatarUrl;
    private Boolean typing; // true = Đang nhập, false = Ngừng nhập
}

