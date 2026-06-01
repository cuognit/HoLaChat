package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class TypingRequest {
    private Long roomId;
    private Long userId;
    private String userName;
    private String avatarUrl;
    private Boolean typing; // true = đang nhập, false = ngừng nhập
}
