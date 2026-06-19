package com.hola.HoLa.dto;

import com.hola.HoLa.model.MemberRole;
import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho UpdateRoleRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class UpdateRoleRequest {
    private MemberRole role;
}

