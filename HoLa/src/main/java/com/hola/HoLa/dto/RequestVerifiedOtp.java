package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho RequestVerifiedOtp.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class RequestVerifiedOtp {
    private String email;
    private String otp;
}

