package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho RequestLogin.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class RequestLogin {
    private String email;
    private String passWord;

}

