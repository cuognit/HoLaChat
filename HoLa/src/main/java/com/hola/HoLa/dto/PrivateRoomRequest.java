package com.hola.HoLa.dto;

import lombok.Data;

@Data
public class PrivateRoomRequest {
    private Long userId;
    private Long otherUserId;
}
