package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho PrivateRoomRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class PrivateRoomRequest {
    private Long userId;
    private Long otherUserId;
}

