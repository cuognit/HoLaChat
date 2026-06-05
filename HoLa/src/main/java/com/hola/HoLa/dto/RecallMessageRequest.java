package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class RecallMessageRequest {
    private Long messageId;
    private Long userId;
}
