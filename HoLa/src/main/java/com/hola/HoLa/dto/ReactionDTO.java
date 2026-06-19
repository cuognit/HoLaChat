package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho ReactionDTO.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class ReactionDTO {
    private Long userId;
    private String userName;
    private String avatarUrl;
    private String emoji;
}

