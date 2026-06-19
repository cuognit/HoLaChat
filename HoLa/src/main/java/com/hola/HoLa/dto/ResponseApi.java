package com.hola.HoLa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
/**
 * Lớp DTO (Data Transfer Object) cho ResponseApi.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class ResponseApi<T> {
    private int status;
    private String message;
    private T data;


}

