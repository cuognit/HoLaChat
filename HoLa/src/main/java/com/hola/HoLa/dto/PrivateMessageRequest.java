package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class PrivateMessageRequest {
    private Long roomId;
    private Long senderId;
    private Long receiverId;
    private String content;
}
