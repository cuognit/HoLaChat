package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class MessageReactionRequest {
    private String emoji; // Có thể null hoặc rỗng để gỡ cảm xúc
}
