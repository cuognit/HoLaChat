package com.hola.HoLa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
/**
 * Lớp DTO (Data Transfer Object) cho SeenUserDTO.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class SeenUserDTO {
    private Long userId;
    private String userName;
    private String avatarUrl;
}

