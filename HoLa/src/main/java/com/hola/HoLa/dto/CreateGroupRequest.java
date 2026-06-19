package com.hola.HoLa.dto;

import lombok.Data;
import java.util.List;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho CreateGroupRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class CreateGroupRequest {
    private String roomName;
    private String avatarUrl;
    private List<Long> memberIds;
}

