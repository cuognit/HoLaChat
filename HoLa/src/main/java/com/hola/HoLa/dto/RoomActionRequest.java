package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho RoomActionRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class RoomActionRequest {
    private Long userId;
    private Long roomId;
    private String userName;
    private String avatarUrl;
    // Danh sách những người đã xem (broadcast từ server về FE)
    private java.util.List<SeenUserDTO> seenByUsers;
}

