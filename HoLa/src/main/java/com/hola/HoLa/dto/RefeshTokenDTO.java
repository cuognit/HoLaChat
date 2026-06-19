package com.hola.HoLa.dto;

import java.time.LocalDateTime;

import org.springframework.format.annotation.DateTimeFormat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
/**
 * Lớp DTO (Data Transfer Object) cho RefeshTokenDTO.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class RefeshTokenDTO {
    private Long userId;
    private String refreshToken; 
    private Boolean revoked;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiryDate;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}

