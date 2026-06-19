package com.hola.HoLa.dto;

import lombok.Data;

@Data
/**
 * Lớp DTO (Data Transfer Object) cho RequestRegister.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class RequestRegister {
    private String userName;
    private String email;
    private String passWord;

}

