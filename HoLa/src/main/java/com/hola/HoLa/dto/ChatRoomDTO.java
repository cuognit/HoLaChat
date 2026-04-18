package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class ChatRoomDTO {
    private Long id;
    private String roomName;
    private Boolean isGroup;
    private String avatarUrl;
    
}
