package com.hola.HoLa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
/**
 * Lớp DTO (Data Transfer Object) cho GroupEvent.
 * Dùng để truyền tải dữ liệu giữa Client và Server.
 */
public class GroupEvent {
    private String type;
    private Object data;
}

