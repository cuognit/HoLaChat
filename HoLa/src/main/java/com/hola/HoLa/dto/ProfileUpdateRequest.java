package com.hola.HoLa.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho ProfileUpdateRequest.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class ProfileUpdateRequest {
    private String userName;
    private String gender;
    private LocalDate birthday;
}

