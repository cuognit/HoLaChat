package com.hola.HoLa.dto;

import lombok.Data;
import java.util.List;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho AddMembersRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class AddMembersRequest {
    private List<Long> memberIds;
}

